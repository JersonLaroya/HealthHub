<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Notifications\AppointmentReminder;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders';

    protected $description = 'Send email reminders for upcoming approved appointments';

    public function handle()
    {
        $nowManila = now()->timezone('Asia/Manila');
        $oneHourLater = $nowManila->copy()->addHour();

        $this->info('Now Manila: ' . $nowManila->format('Y-m-d H:i:s'));

        $appointments = Appointment::query()
            ->where('status', 'approved')
            ->whereNotNull('appointment_slot_id')
            ->with(['user', 'slot'])
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            if (!$appointment->slot || !$appointment->user) {
                continue;
            }

            $appointmentDateTime = Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $appointment->slot->appointment_date->format('Y-m-d') . ' ' . substr($appointment->slot->start_time, 0, 8),
                'Asia/Manila'
            );

            $this->info('Checking appointment Manila: ' . $appointmentDateTime->format('Y-m-d H:i:s'));

            if ($appointmentDateTime->between($nowManila, $oneHourLater)) {
                $appointment->user->notify(new AppointmentReminder($appointment));
                $sent++;
            }
        }

        $this->info("Sent {$sent} reminder(s).");

        return Command::SUCCESS;
    }
}