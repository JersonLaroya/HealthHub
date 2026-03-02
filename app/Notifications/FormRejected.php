<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FormRejected extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $serviceName,
        public string $serviceSlug,
        public string $reason
    ) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addSeconds(10),
        ];
    }

    public function toDatabase($notifiable)
    {
        $reasonText = trim($this->reason);

        return [
            'slug'         => 'form-rejected',
            'service_slug' => $this->serviceSlug,
            'title'        => 'Medical Form Rejected',
            // include the reason inside the message for the UI
            'message'      => $reasonText
                ? "Reason: {$reasonText}"
                : 'Your medical form was rejected. Please review your submission or message clinic staff for more information.',
            'reason'       => $reasonText ?: null, // keep raw reason too (useful later)
            'service'      => $this->serviceName,
            'url'          => "/user/files/{$this->serviceSlug}",
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Medical Form Rejected')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your medical form was rejected.')
            ->line('Form: ' . $this->serviceName)
            // show reason in email too
            ->line('Reason: ' . $this->reason)
            ->action('Review Form', url("/user/files/{$this->serviceSlug}"))
            ->line('Thank you.');
    }
}