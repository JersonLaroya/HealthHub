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

        // 1️⃣ Skip if already seen
        if ($message->is_seen) {
            Log::channel('stack')->info('Email skipped: message already seen', [
                'message_id' => $message->id,
                'receiver_id' => $message->receiver_id,
            ]);
            return;
        }

        // 2️⃣ Skip if there is already an earlier unread message
        $alreadyNotified = Message::where('receiver_id', $message->receiver_id)
            ->where('conversation_key', $message->conversation_key)
            ->where('id', '<', $message->id)
            ->whereRaw('is_seen IS FALSE')
            ->exists();

        if ($alreadyNotified) {
            Log::channel('stack')->info('Email skipped: earlier unread message exists', [
                'message_id' => $message->id,
                'receiver_id' => $message->receiver_id,
                'conversation_key' => $message->conversation_key,
            ]);
            return;
        }

        // 3️⃣ Send email
        Mail::to($message->receiver->email)
            ->send(new NewChatMessageMail($message));

        // 4️⃣ Log success
        Log::channel('stack')->info('New chat message email sent', [
            'message_id' => $message->id,
            'receiver_id' => $message->receiver_id,
            'email' => $message->receiver->email,
        ]);
    }
}
