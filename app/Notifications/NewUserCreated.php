<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewUserCreated extends Notification implements ShouldQueue
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
            ->subject('Your HealthHub Account')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('An account has been created for you in HealthHub.')
            ->line('You can login using:')
            ->line('Email: ' . $notifiable->email)
            ->line('Temporary password: ' . $this->plainPassword)
            ->line('For security, please change your password after logging in.')
            ->action('Login', url('/login'))
            ->line('If you were not expecting this account, please contact the clinic.');
    }
}
