<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Events\MessageSent;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Get inbox (latest message per conversation)
     */
    public function index()
    {
        $userId = Auth::id();

        // subquery: latest message per conversation
        $latestMessages = Message::selectRaw('MAX(id) as id')
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            })
            ->groupBy('conversation_key');

        $messages = Message::whereIn('id', $latestMessages)
            ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($messages);
    }

    /**
     * Fetch full conversation with a user
     */
    public function conversation($userId)
    {
        $authId = Auth::id();

        $key = $authId < $userId 
            ? "{$authId}_{$userId}" 
            : "{$userId}_{$authId}";

        $messages = Message::where('conversation_key', $key)
            ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ->orderBy('created_at')
            ->get();

        // mark messages as seen
        Message::where('conversation_key', $key)
            ->where('receiver_id', $authId)
            ->where('is_seen', false)
            ->update(['is_seen' => true]);

        return response()->json($messages);
    }

    /**
     * Send message (text or image)
     */
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $sender = Auth::user();
        $receiver = User::with('userRole')->findOrFail($request->receiver_id);

        if (!ChatService::canMessage($sender, $receiver)) {
            abort(403, 'You are not allowed to message this user.');
        }

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('chat', 'public');
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'body' => $request->body,
            'image_path' => $imagePath,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(
            $message->load([
                'sender:id,first_name,last_name',
                'receiver:id,first_name,last_name'
            ])
        );
    }

    /**
     * Mark one message as seen
     */
    public function markSeen(Message $message)
    {
        if ($message->receiver_id !== Auth::id()) {
            abort(403);
        }

        $message->update(['is_seen' => true]);

        return response()->json(['success' => true]);
    }
}
