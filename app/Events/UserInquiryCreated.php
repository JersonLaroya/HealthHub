<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserInquiryCreated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $patientId,
        public int $inquiryId
    ) {}

    public function broadcastOn()
    {
        return new PrivateChannel('admin-inquiries');
    }

    public function broadcastAs()
    {
        return 'user.inquiry.created';
    }

    public function broadcastWith(): array
    {
        return [
            'patientId' => $this->patientId,
            'inquiryId' => $this->inquiryId,
        ];
    }
}
