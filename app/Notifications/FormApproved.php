<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FormApproved extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $serviceName,
        public string $serviceSlug
    ) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title'   => 'Medical Form Approved',
            'message' => 'Your medical form has been approved. You may message clinic staff for more information.',
            'service' => $this->serviceName,
            'url' => "/user/files/{$this->serviceSlug}",
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
            ->subject('Medical Form Approved')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your medical form has been approved.')
            ->line('Form: ' . $this->serviceName)
            ->line('You may message clinic staff for more information.')
            ->action('Open Form', url("/user/files/{$this->serviceSlug}"))
            ->line('Stay healthy!');
    }
}
