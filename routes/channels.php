<?php

use Illuminate\Support\Facades\Broadcast;

// Broadcast::channel('notifications.{userId}', function ($user, $userId) {
//     return (int) $user->id === (int) $userId;
// });

// Broadcast::channel('chat.{userId}', function ($user, $userId) {
//     return (int) $user->id === (int) $userId;
// });


/*
|--------------------------------------------------------------------------
| Default Laravel notification channel
|--------------------------------------------------------------------------
*/
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
|--------------------------------------------------------------------------
| Your existing chat channel
|--------------------------------------------------------------------------
*/
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('admin-consultations', function ($user) {
    return in_array($user->userRole->name, ['Admin', 'Super Admin', 'Nurse']);
});

Broadcast::channel('admin-consultations', function ($user) {
    return in_array($user->userRole->name, ['Admin', 'Nurse']);
});