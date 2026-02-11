<?php

namespace App\Notifications;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $date = Carbon::parse($this->appointment->appointment_date)
            ->format('M d, Y');

        $start = Carbon::parse($this->appointment->start_time)
            ->format('g:i A');

        $end = Carbon::parse($this->appointment->end_time)
            ->format('g:i A');

        return (new MailMessage)
            ->subject('Appointment Approved')
            ->greeting('Good news!')
            ->line('Your appointment has been approved.')
            ->line("Schedule: {$date} | {$start} - {$end}")
            ->action('View Appointment', url('/user/appointments'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Appointment Approved',
            'message' => 'Your appointment has been approved.',
            'appointment_id' => $this->appointment->id,
            'url' => '/user/appointments',
        ];
    }
}
