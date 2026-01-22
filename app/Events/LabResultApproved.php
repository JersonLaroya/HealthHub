<?php

namespace App\Events;

use App\Models\Record;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;

class LabResultApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Record $record) {}

    public function broadcastOn()
    {
        return new PrivateChannel('lab-results');
    }

    public function broadcastAs()
    {
        return 'lab-result-approved';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->record->id,
            'status' => $this->record->status,
        ];
    }
}
