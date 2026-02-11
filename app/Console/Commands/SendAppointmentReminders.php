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
    $nowManila = now()->timezone('Asia/Manila');

    $this->info('Now Manila: ' . $nowManila);

    $appointments = Appointment::where('status', 'approved')
        ->with('user')
        ->get();

    foreach ($appointments as $appointment) {

        $appointmentDateTime = \Carbon\Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $appointment->appointment_date . ' ' . $appointment->start_time,
            'Asia/Manila'
        );

        $this->info('Checking appointment Manila: ' . $appointmentDateTime);

        if ($appointmentDateTime->between(
            $nowManila,
            $nowManila->copy()->addHour()
        )) {

            $appointment->user->notify(
                new AppointmentReminder($appointment)
            );
        }
    }
}

}
