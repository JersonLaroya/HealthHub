<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LabNotificationsRead implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public int $recordId) {}

    public function broadcastOn()
    {
        return new PrivateChannel('staff-notifications');
    }

    public function broadcastAs()
    {
        return 'lab-notifications-read';
    }
}
