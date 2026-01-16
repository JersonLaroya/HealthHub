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
        ->select(
            'id',
            'sender_id',
            'receiver_id',
            'conversation_key',
            'body',
            'image_path',
            'is_seen',
            'created_at'
        )
        ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
        ->orderByDesc('created_at')
        ->get();

        return response()->json($messages);
    }

    /**
     * Fetch full conversation with a user
     */
    public function conversation($userId, Request $request)
    {
        $authId = Auth::id();

        $key = $authId < $userId ? "{$authId}_{$userId}" : "{$userId}_{$authId}";

        $query = Message::where('conversation_key', $key)
            ->select(
                'id',
                'sender_id',
                'receiver_id',
                'conversation_key',
                'body',
                'image_path',
                'is_seen',
                'created_at'
            )
            ->with([
                'sender:id,first_name,last_name',
                'receiver:id,first_name,last_name'
            ]);

        if ($request->filled('before')) {
            $query->where('id', '<', $request->before);
        }

        $messages = $query
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->reverse()
            ->values();

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

        // broadcast(new MessageSent($message))->toOthers();
        broadcast(new MessageSent($message));

        return response()->json(
            $message->load([
                'sender:id,first_name,last_name',
                'receiver:id,first_name,last_name'
            ])
        );
    }

    public function contacts()
    {
        $auth = Auth::user();

        $users = User::with('userRole')
            ->where('id', '!=', $auth->id)
            ->get()
            ->filter(fn ($u) => ChatService::canMessage($auth, $u))
            ->values()
            ->map(fn ($u) => [
                'id' => $u->id,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
            ]);

        return response()->json($users);
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
