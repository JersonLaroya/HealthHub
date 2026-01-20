<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MissingPersonalInfo extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    protected function payload()
    {
        return [
            'title' => 'Personal information incomplete',
            'message' => 'Please complete your personal information.',
            'slug' => 'personal-info',
            'url' => '/user/personal-info',
        ];
    }

    public function toDatabase($notifiable)
    {
        return $this->payload();
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->payload());
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Personal Information Incomplete')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Our records show that your personal information is incomplete.')
            ->line('Please complete your personal information to continue using the system without issues.')
            ->action('Complete my information', url('/user/personal-info'))
            ->line('Thank you.');
    }
}
