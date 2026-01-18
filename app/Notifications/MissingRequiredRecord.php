<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

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
        return ['database'];
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
}
