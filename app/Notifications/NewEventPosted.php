<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;
use Illuminate\Notifications\Messages\MailMessage;

class NewEventPosted extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(public $event) {}

    public function via($notifiable)
    {
        Log::info('🔥 NewEventPosted via() called', ['id' => $notifiable->id]);

        return ['database', 'broadcast', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'New Event',
            'message' => "A new event was posted: {$this->event->title}",
            'slug' => 'event',
            'event_id' => $this->event->id,
            'url' => '/user/dashboard',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'title' => 'New Event',
            'message' => "A new event was posted: {$this->event->title}",
            'url' => '/user/dashboard',
        ]);
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New Event Posted')
            ->greeting("Hello {$notifiable->first_name},")
            ->line("A new event has been posted:")
            ->line($this->event->title)
            ->action('View Event', url('/user/dashboard'))
            ->line('Thank you for using HealthHub.');
    }
}