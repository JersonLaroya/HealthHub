<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RcyInquiryCreated implements ShouldBroadcast
{
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
        return 'rcy.inquiry.created';
    }
}
