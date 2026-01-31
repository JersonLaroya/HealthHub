<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class LabResultRejected extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $serviceName
    ) {}

    public function via($notifiable)
    {
        // database + broadcast = instant
        // mail = delayed
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Delay only the email notification
     */
    public function withDelay($notifiable)
    {
        return [
            'mail' => now()->addSeconds(10), // ⏱ email after 10 seconds
        ];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title'   => 'Laboratory Result Rejected',
            'message' => 'Your laboratory result was rejected. Please resubmit and message the clinic nurses for more information.',
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
            ->subject('Laboratory Result Rejected')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your laboratory result was rejected by the clinic.')
            ->line('Service: ' . $this->serviceName)
            ->action('Resubmit Laboratory Result', url('/user/laboratory-results'))
            ->line('Please upload a corrected laboratory result.')
            ->line('Thank you for using HealthHub.');
    }
}
