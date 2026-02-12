<?php

namespace App\Listeners;

use App\Events\MessageSent;
use App\Mail\NewChatMessageMail;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendMessageEmailNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Delay the job by 2 minutes
     */
    public int $delay = 120;

    public function handle(MessageSent $event)
    {
        $message = $event->message->fresh();
        $receiver = $message->receiver;

        // 🔥 NEW: Skip if user active within last 2 minutes
        if (
            $receiver->last_seen_at &&
            $receiver->last_seen_at->diffInMinutes(now()) < 2
        ) {
            Log::channel('stack')->info('Email skipped: user recently active', [
                'receiver_id' => $receiver->id,
                'last_seen_at' => $receiver->last_seen_at,
            ]);
            return;
        }

        // 1️⃣ Skip if already seen
        if ($message->is_seen) {
            Log::channel('stack')->info('Email skipped: message already seen', [
                'message_id' => $message->id,
                'receiver_id' => $message->receiver_id,
            ]);
            return;
        }

        // 2️⃣ Cooldown logic (6-hour reminder window)

        $oldestUnread = Message::where('receiver_id', $receiver->id)
            ->where('conversation_key', $message->conversation_key)
            ->whereRaw('is_seen IS FALSE')
            ->orderBy('id')
            ->first();

        if ($oldestUnread) {

            $hoursSinceOldestUnread = $oldestUnread->created_at->diffInHours(now());

            // If unread exists and it's less than 6 hours old → skip
            if ($hoursSinceOldestUnread < 6 && $oldestUnread->id !== $message->id) {
                Log::channel('stack')->info('Email skipped: within 6-hour cooldown', [
                    'receiver_id' => $receiver->id,
                    'oldest_unread_id' => $oldestUnread->id,
                    'hours_since_oldest' => $hoursSinceOldestUnread,
                ]);
                return;
            }
        }

        // 3️⃣ Send email
        Mail::to($receiver->email)
            ->send(new NewChatMessageMail($message));

        // 4️⃣ Log success
        Log::channel('stack')->info('New chat message email sent', [
            'message_id' => $message->id,
            'receiver_id' => $message->receiver_id,
            'email' => $receiver->email,
        ]);
    }
}
