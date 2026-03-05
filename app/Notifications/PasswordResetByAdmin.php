<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PasswordResetByAdmin extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $plainPassword
    ) {}

    /**
     * Only send email
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Optional: delay email sending
     */
    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addSeconds(10),
        ];
    }

    /**
     * Email content
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('HealthHub Password Reset')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your HealthHub account password has been reset by the clinic administrator.')
            ->line('You can login using:')
            ->line('Email: ' . $notifiable->email)
            ->line('Temporary password: ' . $this->plainPassword)
            ->line('For security, please change your password immediately after logging in.')
            ->action('Login', url('/login'))
            ->line('If you did not request this change, please contact the clinic immediately.');
    }
}