<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewAppointmentRequested extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment
    ) {}

    /**
     * Channels
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Email notification
     */
    public function toMail(object $notifiable): MailMessage
    {
        $user = $this->appointment->user;

        return (new MailMessage)
            ->subject('New Appointment Request')
            ->greeting('Hello!')
            ->line("{$user->first_name} {$user->last_name} has requested an appointment.")
            ->line(
                'Date: ' .
                $this->appointment->appointment_date .
                ' | ' .
                $this->appointment->start_time .
                ' - ' .
                $this->appointment->end_time
            )
            ->action(
                'View Appointments',
                url('/admin/appointments')
            )
            ->line('Please review and take action.');
    }

    /**
     * In-app + broadcast payload
     */
    public function toArray(object $notifiable): array
    {
        $user = $this->appointment->user;

        return [
            'title' => 'New Appointment Request',
            'message' => "{$user->first_name} {$user->last_name} requested an appointment.",
            'appointment_id' => $this->appointment->id,
            'url' => '/admin/appointments',
        ];
    }
}
