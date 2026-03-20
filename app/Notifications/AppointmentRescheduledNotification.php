<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class AppointmentRescheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private const TIMEZONE = 'Asia/Manila';

    private function fmtDate(string $date): string
    {
        return Carbon::parse($date, self::TIMEZONE)->format('M d, Y');
    }

    private function fmtTime(string $time): string
    {
        $t = substr($time, 0, 5);
        return Carbon::createFromFormat('H:i', $t, self::TIMEZONE)->format('g:i A');
    }

    public function __construct(
        public Appointment $appointment,
        public string $oldDate,
        public string $oldStart,
        public string $oldEnd
    ) {
        $this->appointment->loadMissing(['user', 'slot']);
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $user = $this->appointment->user;
        $slot = $this->appointment->slot;

        $newDate = $slot ? $this->fmtDate($slot->appointment_date) : 'No date available';
        $newStart = $slot ? $this->fmtTime($slot->start_time) : '--';
        $newEnd = $slot ? $this->fmtTime($slot->end_time) : '--';

        return (new MailMessage)
            ->subject('Appointment Reschedule Request')
            ->greeting('Hello!')
            ->line("{$user->first_name} {$user->last_name} requested to reschedule an appointment.")
            ->line("Previous schedule: {$this->fmtDate($this->oldDate)} | {$this->fmtTime($this->oldStart)} - {$this->fmtTime($this->oldEnd)}")
            ->line("New schedule: {$newDate} | {$newStart} - {$newEnd}")
            ->action('Review Appointment', url('/admin/appointments'))
            ->line('Please review and take action.');
    }

    public function toArray(object $notifiable): array
    {
        $user = $this->appointment->user;
        $slot = $this->appointment->slot;

        return [
            'title' => 'Appointment Reschedule Request',
            'message' => "{$user->first_name} {$user->last_name} requested to reschedule an appointment.",
            'previous_schedule' => [
                'date' => $this->fmtDate($this->oldDate),
                'start_time' => $this->fmtTime($this->oldStart),
                'end_time' => $this->fmtTime($this->oldEnd),
            ],
            'new_schedule' => [
                'date' => $slot ? $this->fmtDate($slot->appointment_date) : null,
                'start_time' => $slot ? $this->fmtTime($slot->start_time) : null,
                'end_time' => $slot ? $this->fmtTime($slot->end_time) : null,
            ],
            'appointment_id' => $this->appointment->id,
            'url' => '/admin/appointments',
        ];
    }
}