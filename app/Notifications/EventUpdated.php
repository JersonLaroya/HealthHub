<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class EventUpdated extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(public Event $event) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Event updated',
            'message' => "{$this->event->title} has been updated.",
            'url' => '/user/dashboard',
            'slug' => 'event-updated',
            'event_id' => $this->event->id,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'title' => 'Event updated',
            'message' => "{$this->event->title} has been updated.",
            'url' => '/user/dashboard',
        ]);
    }
}