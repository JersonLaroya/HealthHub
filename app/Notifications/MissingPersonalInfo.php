<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MissingPersonalInfo extends Notification
{
    use Queueable;

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Profile Incomplete',
            'message' => 'Please complete your personal information.',
            'slug' => 'personal-info',
            'url' => '/user/personal-info',
            'priority' => 1, // optional (for sorting later)
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Profile Incomplete')
            ->greeting("Hello {$notifiable->first_name},")
            ->line('Your profile is incomplete.')
            ->action('Complete Profile', url('/user/personal-info'))
            ->line('Please complete your information as soon as possible.');
    }
}
