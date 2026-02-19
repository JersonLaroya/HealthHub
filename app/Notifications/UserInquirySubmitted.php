<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class UserInquirySubmitted extends Notification
{
    use Queueable;

    public function __construct(
        public int $inquiryId,
        public int $patientId,
        public string $patientName,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'slug' => 'user-inquiry',
            'title' => 'New inquiry submitted',
            'message' => "{$this->patientName} submitted an inquiry.",
            'inquiry_id' => (string) $this->inquiryId,
            'patient_id' => (string) $this->patientId,
            // where should admin/nurse go when clicking?
            'url' => "/admin/patients/{$this->patientId}/inquiries",
        ];
    }
}

