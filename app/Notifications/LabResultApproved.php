<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class LabResultApproved extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $serviceName
    ) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title'   => 'Laboratory Result Approved',
            'message' => 'Your laboratory result has been approved by the clinic.',
            'service' => $this->serviceName,
            'url'     => '/user/laboratory-results',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage(
            $this->toDatabase($notifiable)
        );
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Laboratory Result Approved')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your laboratory result has been approved by the clinic.')
            ->line('Service: ' . $this->serviceName)
            ->action('View Laboratory Results', url('/user/laboratory-results'))
            ->line('Thank you for using HealthHub.');
    }
}
