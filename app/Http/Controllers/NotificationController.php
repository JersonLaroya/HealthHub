<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 10;

        $notifications = auth()->user()
            ->notifications()
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => $notifications->map(fn ($n) => [
                'id' => $n->id,
                'title' => $n->data['title'] ?? 'Notification',
                'message' => $n->data['message'] ?? '',
                'url' => $n->data['url'] ?? null,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at->diffForHumans(),
            ]),
            'has_more' => $notifications->hasMorePages(),
        ]);
    }

    public function unreadCount()
    {
        return response()->json([
            'count' => auth()->user()->unreadNotifications()->count()
        ]);
    }

    public function markRead($id)
    {
        $notification = auth()->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }
}
