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
    try {
        $userId = Auth::id();

        // $latestMessageIds = Message::query()
        //     ->where(function ($q) use ($userId) {
        //         $q->where('sender_id', $userId)
        //           ->orWhere('receiver_id', $userId);
        //     })
        //     ->selectRaw('MAX(id) as id')
        //     ->groupBy('conversation_key');

        $messages = Message::query()
            ->whereIn('id', function ($q) use ($userId) {
                $q->from('messages')
                ->selectRaw('MAX(id)')
                ->where(function ($q2) use ($userId) {
                    $q2->where('sender_id', $userId)
                        ->orWhere('receiver_id', $userId);
                })
                ->groupBy('conversation_key');
            })
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
            ])
            ->orderByDesc('id')
            ->get();

        $messages->transform(function ($message) use ($userId) {
            $message->has_unread = Message::query()
                ->where('conversation_key', $message->conversation_key)
                ->where('receiver_id', $userId)
                ->whereRaw('is_seen = false')
                ->exists();

            return $message;
        });

        return response()->json($messages->sortByDesc('created_at')->values());

    } catch (\Throwable $e) {
        Log::error('messages.index failed', [
            'user_id' => Auth::id(),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'error' => 'Failed to load inbox',
            'debug' => $e->getMessage(),
        ], 500);
    }
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
            'image' => 'nullable|image|max:10240',
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

        $message->load([
            'sender:id,first_name,last_name,user_role_id',
            'sender.userRole:id,name,category',
            'receiver:id,first_name,last_name,user_role_id',
            'receiver.userRole:id,name,category',
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function contacts(Request $request)
{
    $auth = Auth::user();

    $search = trim((string) $request->query('search', ''));
    $roleFilter = strtolower((string) $request->query('role_filter', 'all'));

    $senderRole = strtolower((string) optional($auth->userRole)->name);
    $senderCategory = strtolower((string) optional($auth->userRole)->category);

    $query = User::query()
        ->join('user_roles', 'user_roles.id', '=', 'users.user_role_id')
        ->where('users.id', '!=', $auth->id)
        ->select(
            'users.id',
            'users.first_name',
            'users.last_name',
            DB::raw('user_roles.name as user_role_name'),
            DB::raw('user_roles.category as user_role_category')
        );

    // allowed contacts based on current user role
    $query->where(function ($q) use ($senderRole, $senderCategory) {
        if ($senderRole === 'super admin') {
            $q->where(function ($x) {
                $x->where('user_roles.name', 'ilike', 'admin')
                ->orWhere('user_roles.name', 'ilike', 'nurse');
            });
        } elseif ($senderRole === 'admin' || $senderRole === 'nurse') {
            $q->where(function ($x) {
                $x->where('user_roles.name', 'ilike', 'super admin')
                    ->orWhere('user_roles.category', 'ilike', 'user')
                    ->orWhere('user_roles.category', 'ilike', 'rcy');
            });
        } elseif (in_array($senderCategory, ['user', 'rcy'])) {
            $q->where(function ($x) {
                $x->where('user_roles.name', 'ilike', 'admin')
                ->orWhere('user_roles.name', 'ilike', 'nurse');
            });
        } else {
            $q->whereRaw('1 = 0');
        }
    });

    // filter tabs
    if ($roleFilter !== 'all') {
        $query->where(function ($q) use ($roleFilter) {
            if ($roleFilter === 'student') {
               $q->where('user_roles.name', 'ilike', 'student')
                 ->orWhere('user_roles.category', 'ilike', 'rcy');
            } elseif ($roleFilter === 'employee') {
                $q->where('user_roles.name', 'ilike', 'staff')
                    ->orWhere('user_roles.name', 'ilike', 'faculty');
            } elseif ($roleFilter === 'sa') {
                $q->where('user_roles.name', 'ilike', 'super admin');
            }
        });
    }

    // search
    if ($search !== '') {
        $query->where(function ($q) use ($search) {
            $q->where('users.first_name', 'ilike', "%{$search}%")
            ->orWhere('users.last_name', 'ilike', "%{$search}%");
        });
    }

    $contacts = $query
        ->orderBy('users.first_name')
        ->orderBy('users.last_name')
        ->simplePaginate(20);

    return response()->json($contacts);
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
                ->whereRaw('is_seen = false')
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
        $userId = Auth::id();

        Log::info('Unread count request', [
            'user_id' => $userId,
        ]);

        $count = Message::query()
            ->where('receiver_id', $userId)
            ->whereRaw('is_seen = false')
            ->count();

        Log::info('Unread count result', [
            'user_id' => $userId,
            'count' => $count,
        ]);

        return response()->json(['count' => $count]);

    } catch (\Throwable $e) {
        Log::error('Unread count failed', [
            'user_id' => Auth::id(),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'error' => 'Unread count failed',
            'debug' => $e->getMessage(),
        ], 500);
    }
}


}
