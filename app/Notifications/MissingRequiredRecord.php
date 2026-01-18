<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MissingRequiredRecord extends Notification
{
    use Queueable;

    protected string $message;
    protected string $slug;

    public function __construct(string $message, string $slug)
    {
        $this->message = $message;
        $this->slug = $slug;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title'   => 'Medical Requirement',
            'message' => $this->message,
            'slug'    => $this->slug,
            'url'     => match ($this->slug) {
                'personal-info'  => '/user/personal-info',
                'pre-enrollment' => '/user/files/pre-enrollment-health-form',
                'pre-employment' => '/user/files/pre-employment-health-form',
                default => '/user/files',
            },
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Medical Requirement Needed')
            ->greeting("Hello {$notifiable->first_name},")
            ->line($this->message)
            ->action('Complete Now', url($this->toDatabase($notifiable)['url']))
            ->line('This is required to continue using HealthHub services.');
    }
}
