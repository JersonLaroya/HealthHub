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
        $date = \Carbon\Carbon::parse($this->appointment->appointment_date)
            ->format('M d, Y');

        $start = \Carbon\Carbon::parse($this->appointment->start_time)
            ->format('g:i A');

        $end = \Carbon\Carbon::parse($this->appointment->end_time)
            ->format('g:i A');

        return (new MailMessage)
            ->subject('Appointment Reminder')
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('This is a reminder for your upcoming appointment.')
            ->line('Date: ' . $date)
            ->line("Time: {$start} - {$end}")
            ->line('Purpose: ' . $this->appointment->purpose)
            ->line('Please arrive on time.')
            ->salutation('Thank you.');
    }
}
