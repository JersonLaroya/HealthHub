<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class RcyConsultationCreated implements ShouldBroadcast
{
    public function __construct(
        public int $patientId
    ) {}

    public function broadcastOn()
    {
        return new PrivateChannel('admin-consultations');
    }

    public function broadcastAs()
    {
        return 'rcy.consultation.created';
    }
}

