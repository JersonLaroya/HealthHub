<?php

namespace App\Events;

use App\Models\Record;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LabResultRejected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Record $record) {}

    public function broadcastOn()
    {
        return new PrivateChannel('lab-results');
    }

    public function broadcastAs()
    {
        return 'lab-result-rejected';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->record->id,
            'status' => $this->record->status,
        ];
    }
}
