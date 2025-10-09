<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewNotificationEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct($notification)
    {
        $this->notification = $notification;
    }

    /**
     * The name of the channel the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        // Use a private channel for authenticated users
        return new PrivateChannel('notifications.' . $this->notification['user_id']);
    }

    /**
     * Optional: customize event name
     */
    public function broadcastAs(): string
    {
        return 'new-notification';
    }
}
