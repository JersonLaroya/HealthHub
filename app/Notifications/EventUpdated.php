<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class EventUpdated extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(public Event $event) {}

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
            'title'    => 'Event Updated',
            'message'  => "{$this->event->title} has been updated.",
            'slug'     => 'event-updated',
            'event_id' => $this->event->id,
            'url'      => '/user/dashboard',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'title'   => 'Event Updated',
            'message' => "{$this->event->title} has been updated.",
            'url'     => '/user/dashboard',
        ]);
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Event Updated')
            ->greeting("Hello {$notifiable->first_name},")
            ->line('The following event was updated:')
            ->line($this->event->title)
            ->action('View Event', url('/user/dashboard'))
            ->line('Please check the updated details.');
    }
}
