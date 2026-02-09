<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public ?string $reason = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Appointment Rejected')
            ->greeting('Appointment Update')
            ->line('Unfortunately, your appointment request was rejected.');

        if ($this->reason) {
            $mail->line('Reason: ' . $this->reason);
        }

        return $mail
            ->action('View Appointments', url('/user/appointments'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Appointment Rejected',
            'message' => $this->reason
                ? 'Your appointment was rejected: ' . $this->reason
                : 'Your appointment was rejected.',
            'appointment_id' => $this->appointment->id,
            'url' => '/user/appointments',
        ];
    }
}
