<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MissingRequiredRecord extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $message,
        public string $slug
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

    protected function payload()
    {
        return [
            'title'   => 'Missing medical requirement',
            'message' => $this->message,
            'slug'    => $this->slug,
            'url'     => '/user/files',
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
            ->subject('Missing Medical Requirement')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($this->message)
            ->line('Please log in and submit the required medical form.')
            ->action('Go to my files', url('/user/files'))
            ->line('Thank you.');
    }
}
