<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment Reminder')
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('This is a reminder for your upcoming appointment.')
            ->line(
                'Date: ' . $this->appointment->appointment_date
            )
            ->line(
                'Time: ' .
                $this->appointment->start_time .
                ' - ' .
                $this->appointment->end_time
            )
            ->line('Purpose: ' . $this->appointment->purpose)
            ->line('Please arrive on time.')
            ->salutation('Thank you.');
    }
}
