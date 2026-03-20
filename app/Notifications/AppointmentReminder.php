<?php

namespace App\Notifications;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment
    ) {
        $this->appointment->loadMissing('slot');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $slot = $this->appointment->slot;

        $date = $slot
            ? Carbon::parse($slot->appointment_date)->format('M d, Y')
            : 'No date available';

        $start = $slot
            ? Carbon::parse($slot->start_time)->format('g:i A')
            : '--';

        $end = $slot
            ? Carbon::parse($slot->end_time)->format('g:i A')
            : '--';

        return (new MailMessage)
            ->subject('Appointment Reminder')
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('This is a reminder for your upcoming appointment.')
            ->line('Date: ' . $date)
            ->line("Time: {$start} - {$end}")
            ->line('Purpose: ' . ($this->appointment->purpose ?? 'N/A'))
            ->line('Please arrive on time.')
            ->salutation('Thank you.');
    }
}