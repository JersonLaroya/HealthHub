<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class LabRequestCreated extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(public $serviceName) {}

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
            'title'   => 'New Laboratory Request',
            'message' => 'You have a new laboratory request. Please submit your laboratory results.',
            'service' => $this->serviceName,
            'url'     => '/user/files/laboratory-request-form',
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
            ->subject('New Laboratory Request')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('A new laboratory request has been created for you.')
            ->line('Service: ' . $this->serviceName)
            ->action('View request', url('/user/files/laboratory-request-form'))
            ->line('Please visit the clinic for more details.');
    }
}
