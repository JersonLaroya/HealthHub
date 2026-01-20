<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ConsultationApproved implements ShouldBroadcast
{
    public $patientId;
    public $consultationId;

    public function __construct($patientId, $consultationId)
    {
        $this->patientId = $patientId;
        $this->consultationId = $consultationId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('admin-consultations');
    }

    public function broadcastAs()
    {
        return 'consultation.approved';
    }
}
