<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;

class FormSubmitted extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $formTitle,
        public string $senderName,
        public int $patientId,
        public string $formSlug
    ) {}

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    protected function payload($notifiable)
    {
        $role = $notifiable->userRole?->name;

        $prefix = match ($role) {
            'Admin' => 'admin',
            'Nurse' => 'nurse',
            default => 'admin', // safe fallback
        };

        return [
            'title' => 'New form submitted',
            'message' => "{$this->formTitle} submitted by {$this->senderName}",
            'slug' => 'form-submitted',

            //role-aware redirect
            'url' => "/{$prefix}/patients/{$this->patientId}/files/{$this->formSlug}",
        ];
    }

    public function toDatabase($notifiable)
    {
        return $this->payload($notifiable);
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage(
            $this->payload($notifiable)
        );
    }

    public function toMail($notifiable)
    {
        $data = $this->payload($notifiable);

        return (new MailMessage)
            ->subject('New Medical Form Submitted')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("A new medical form has been submitted.")
            ->line("Form type: {$this->formTitle}")
            ->line("Submitted by: {$this->senderName}")
            ->action('Open record', url($data['url']))
            ->line('Please log in to review the submission.');
    }
}
