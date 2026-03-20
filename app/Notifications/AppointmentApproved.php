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
    ) {
        $this->appointment->loadMissing('slot');
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
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
            ->subject('Appointment Approved')
            ->greeting('Good news!')
            ->line('Your appointment has been approved.')
            ->line("Schedule: {$date} | {$start} - {$end}")
            ->action('View Appointment', url('/user/appointments'));
    }

    public function toArray(object $notifiable): array
    {
        $slot = $this->appointment->slot;

        return [
            'title' => 'Appointment Approved',
            'message' => 'Your appointment has been approved.',
            'appointment_id' => $this->appointment->id,
            'date' => $slot ? Carbon::parse($slot->appointment_date)->format('M d, Y') : null,
            'start_time' => $slot ? Carbon::parse($slot->start_time)->format('g:i A') : null,
            'end_time' => $slot ? Carbon::parse($slot->end_time)->format('g:i A') : null,
            'url' => '/user/appointments',
        ];
    }
}