<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

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
            'dtr_id'             => $this->dtr->id,
            'patient_name'       => $this->dtr->name,
            'submitted_by_id'    => $this->submittedBy?->id ?? auth()->id(),
            'submitted_by_name'  => $this->submittedBy?->name ?? auth()->user()?->name,
            'message'            => "New DTR submitted for {$this->dtr->name}",
            'url'                => route('admin.dtr.index'),
        ];
    }

    public function toBroadcast($notifiable)
    {
        // broadcast the same payload stored in DB
        return new BroadcastMessage([
            'data' => $this->toDatabase($notifiable),
            'created_at' => now()->toDateTimeString(),
        ]);
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New DTR Submitted')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("A new DTR has been submitted for {$this->dtr->name}.")
            ->action('View DTRs', route('admin.dtr.index'))
            ->line('Please review the submitted record.');
    }
}
