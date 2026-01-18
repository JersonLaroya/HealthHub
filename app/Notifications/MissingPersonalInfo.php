<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MissingPersonalInfo extends Notification
{
    use Queueable;

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Profile Incomplete',
            'message' => 'Please complete your personal information.',
            'slug' => 'personal-info',
            'url' => '/user/personal-info',
            'priority' => 1, // optional (for sorting later)
        ];
    }
}
