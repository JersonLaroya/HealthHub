<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InquiryApprovedNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $url = null,
        public ?string $slug = 'inquiry-approved',
        public ?int $inquiryId = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addSeconds(10),
        ];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'title'      => $this->title,
            'message'    => $this->message,
            'url'        => $this->url,
            'slug'       => $this->slug,
            'inquiry_id' => $this->inquiryId,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'title'   => $this->title,
            'message' => $this->message,
            'url'     => $this->url,
            'slug'    => $this->slug,
        ]);
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject($this->title)
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line($this->message)
            ->action('View Inquiry', url($this->url))
            ->line('Thank you.');
    }
}
