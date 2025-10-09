<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewDtrSubmitted extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public $dtr;
    public $submittedBy;

    public function __construct($dtr, $submittedBy = null)
    {
        $this->dtr = $dtr;
        $this->submittedBy = $submittedBy;
    }

    public function via($notifiable)
    {
        // store in DB and broadcast via the broadcast channel
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'dtr_id' => $this->dtr->id,
            'patient_name' => $this->dtr->name,
            'submitted_by_id' => $this->submittedBy?->id ?? auth()->id(),
            'submitted_by_name' => $this->submittedBy?->name ?? auth()->user()?->name,
            'message' => "New DTR submitted for {$this->dtr->name}",
            'url' => route('admin.dtr.index'),
        ];
    }

    public function toBroadcast($notifiable)
    {
        // broadcast the same payload that you store in the DB
        return new BroadcastMessage([
            'data' => $this->toDatabase($notifiable),
            // optionally include a timestamp (DB id won't be available here)
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}
