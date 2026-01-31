<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewUserCreated extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $plainPassword
    ) {}

    public function via($notifiable)
    {
        // database + broadcast = instant
        // mail = delayed
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Delay only the email notification
     */
    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addSeconds(10), // ⏱ email after 10 seconds
        ];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title'   => 'Account Created',
            'message' => 'Your HealthHub account has been created. Check your email for login details.',
            'slug'    => 'account-created',
            'url'     => '/login',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage(
            $this->toDatabase($notifiable)
        );
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
