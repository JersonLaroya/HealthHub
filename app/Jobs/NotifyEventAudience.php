<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\User;
use App\Notifications\EventUpdated;
use App\Notifications\NewEventPosted;
use Illuminate\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class NotifyEventAudience implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Event $event,
        public string $type // 'created' | 'updated'
    ) {}

    public function handle(): void
    {
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('category', ['user', 'rcy'])
        )
        ->cursor()
        ->each(function ($user) {
            $user->notify(
                $this->type === 'created'
                    ? new NewEventPosted($this->event)
                    : new EventUpdated($this->event)
            );
        });
    }
}
