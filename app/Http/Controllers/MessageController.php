<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Events\MessageSent;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Get inbox (latest message per conversation)
     */
    public function index()
{
    $userId = Auth::id();

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
            'image_batch_id',
            'file_path',
            'file_name',
            'file_size',
            'is_seen',
            'created_at'
        )
        ->with([
            'sender' => function ($q) {
                $q->select('id', 'first_name', 'last_name', 'user_role_id')
                  ->with('userRole:id,name,category');
            },
            'receiver' => function ($q) {
                $q->select('id', 'first_name', 'last_name', 'user_role_id')
                  ->with('userRole:id,name,category');
            },
        ])
        ->withExists([
            'conversation as has_unread' => function ($q) use ($userId) {
                $q->where('receiver_id', $userId)
                  ->whereRaw('is_seen = false');
            }
        ])
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
                'image_batch_id',
                'file_path',
                'file_name',
                'file_size',
                'is_seen',
                'created_at'
            )
            ->with([
  'sender:id,first_name,last_name,user_role_id',
  'sender.userRole:id,name,category',
  'receiver:id,first_name,last_name,user_role_id',
  'receiver.userRole:id,name,category',
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
            'file' => 'nullable|file|max:10240', // ⬅ 10MB files
            'image_batch_id' => 'nullable|string|max:100',
            
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

        $filePath = null;
        $fileName = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('chat-files', 'public');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'body' => $request->body,
            'image_path' => $imagePath,
            'image_batch_id' => $request->image_batch_id,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'is_seen' => DB::raw('false'),
        ]);

        // broadcast(new MessageSent($message))->toOthers();
        broadcast(new MessageSent($message))->toOthers();
        // broadcast(new MessageSent($message))->toOthers();

        return response()->json(
    $message->load([
        'sender' => function ($q) {
            $q->select('id', 'first_name', 'last_name', 'user_role_id')
              ->with('userRole:id,name,category');
        },
        'receiver' => function ($q) {
            $q->select('id', 'first_name', 'last_name', 'user_role_id')
              ->with('userRole:id,name,category');
        },
    ])
);
    }

    public function contacts(Request $request)
    {
        $auth = Auth::user();

        $search = $request->search;

        $senderRole     = strtolower($auth->userRole->name ?? '');
        $senderCategory = strtolower($auth->userRole->category ?? '');
        $roleFilter = strtolower($request->query('role_filter', 'all'));

        $query = User::where('users.id', '!=', $auth->id)
    ->leftJoin('user_roles', 'user_roles.id', '=', 'users.user_role_id')
    ->select(
        'users.id',
        'users.first_name',
        'users.last_name',
        DB::raw("user_roles.name as user_role_name"),
        DB::raw("user_roles.category as user_role_category")
    )

            ->whereHas('userRole', function ($q) use ($senderRole, $senderCategory) {

                if ($senderRole === 'super admin') {
                    $q->whereIn(DB::raw('LOWER(name)'), ['admin','nurse']);
                } elseif ($senderRole === 'admin') {
                    $q->whereIn(DB::raw('LOWER(name)'), ['super admin'])
                    ->orWhereIn(DB::raw('LOWER(category)'), ['user','rcy']);
                } elseif ($senderRole === 'nurse') {
                    $q->whereIn(DB::raw('LOWER(name)'), ['super admin'])
                    ->orWhereIn(DB::raw('LOWER(category)'), ['user','rcy']);
                } elseif (in_array($senderCategory, ['user','rcy'])) {
                    $q->whereIn(DB::raw('LOWER(name)'), ['admin','nurse']);
                }
            })
            ->when($roleFilter !== 'all', function ($q) use ($roleFilter) {
    $q->where(function ($x) use ($roleFilter) {

        if ($roleFilter === 'student') {
            $x->whereRaw("LOWER(user_roles.name) = 'student'")
              ->orWhereRaw("LOWER(user_roles.category) = 'rcy'");
        }

        if ($roleFilter === 'employee') {
            $x->whereRaw("LOWER(user_roles.name) IN ('staff','faculty')");
        }

        if ($roleFilter === 'sa') {
            $x->whereRaw("LOWER(user_roles.name) = 'super admin'");
        }
    });
});

        return response()->json(
            $query->orderBy('first_name')->paginate(20)
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

        Message::where('id', $message->id)
            ->update([
                'is_seen' => DB::raw('true')
            ]);

        return response()->json(['success' => true]);
    }

    public function markConversationSeen($userId)
    {
        try {
            Message::where('sender_id', $userId)
                ->where('receiver_id', auth()->id())
                ->whereRaw('is_seen IS FALSE')
                ->update([
                    'is_seen' => DB::raw('true')
                ]);

            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            \Log::error('markConversationSeen failed', [
                'user_id' => auth()->id(),
                'other_user' => $userId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Failed to mark seen'], 500);
        }
    }

        public function unreadCount()
    {
        try {
            Log::info("Unread count request", [
                'user_id' => auth()->id()
            ]);

            $count = Message::where('receiver_id', auth()->id())
                ->whereRaw('is_seen = false')
                ->count();

            Log::info("Unread count result", [
                'count' => $count
            ]);

            return response()->json(['count' => $count]);

        } catch (\Throwable $e) {

            Log::error("Unread count failed", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Unread count failed'
            ], 500);
        }
    }


}
