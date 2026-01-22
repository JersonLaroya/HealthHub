<?php

namespace App\Events;

use App\Models\Record;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FormStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Record $record) {}

    public function broadcastOn(): Channel
    {
        // same idea as lab — one shared staff channel
        return new PrivateChannel('forms');
    }

    public function broadcastAs(): string
    {
        return 'form-status-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'     => $this->record->id,
            'status' => $this->record->status,
            'user_id'=> $this->record->user_id,
        ];
    }
}
