<?php

namespace App\Notifications;

use App\Models\Appointment;
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
        return (new MailMessage)
            ->subject('Appointment Approved')
            ->greeting('Good news!')
            ->line('Your appointment has been approved.')
            ->line(
                'Schedule: ' .
                $this->appointment->appointment_date .
                ' | ' .
                $this->appointment->start_time .
                ' - ' .
                $this->appointment->end_time
            )
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
