<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Contracts\Queue\ShouldQueue;

class NewUserCreated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $plainPassword
    ) {}

    public function via($notifiable)
    {
        return ['mail'];
    }

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
