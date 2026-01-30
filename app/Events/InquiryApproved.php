<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InquiryApproved implements ShouldBroadcast
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
        return 'inquiry.approved';
    }
}
