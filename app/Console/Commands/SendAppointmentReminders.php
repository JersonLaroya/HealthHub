<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Notifications\AppointmentReminder;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders';

    protected $description = 'Send email reminders for upcoming appointments';

    public function handle()
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $appointments = Appointment::where('status', 'approved')
            ->where('appointment_date', $tomorrow)
            ->with('user')
            ->get();

        foreach ($appointments as $appointment) {
            $appointment->user->notify(
                new AppointmentReminder($appointment)
            );
        }

        $this->info('Appointment reminders sent.');
    }
}
