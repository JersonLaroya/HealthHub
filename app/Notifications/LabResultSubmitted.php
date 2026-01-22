<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class LabResultSubmitted extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public $patient,   // User model
        public $recordId   // Record id (optional but useful)
    ) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    protected function data()
    {
        return [
            'title'   => 'Laboratory Results Submitted',
            'message' => "{$this->patient->first_name} {$this->patient->last_name} has submitted laboratory results.",
            'user_id' => $this->patient->id,
            'record_id' => $this->recordId,
            'url' => "/admin/patients/{$this->patient->id}/files/laboratory-results",
        ];
    }

    public function toDatabase($notifiable)
    {
        return $this->data();
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage(
            $this->data()
        );
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Laboratory Results Submitted')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line("{$this->patient->first_name} {$this->patient->last_name} has submitted laboratory results.")
            ->action(
                'View laboratory results',
                url("/admin/patients/{$this->patient->id}/files/laboratory-results")
            )
            ->line('Please review the submitted laboratory results.');
    }
}
