<?php

namespace App\Services;

use App\Models\User;

class ChatService
{
    public static function canMessage(User $sender, User $receiver): bool
    {
        $senderCategory   = $sender->userRole->category ?? null;
        $receiverCategory = $receiver->userRole->category ?? null;

        if (!$senderCategory || !$receiverCategory) {
            return false;
        }

        return (
            // user or rcy  -> staff or system
            (in_array($senderCategory, ['user', 'rcy']) && in_array($receiverCategory, ['staff', 'system']))

            ||

            // staff or system -> user or rcy
            (in_array($senderCategory, ['staff', 'system']) && in_array($receiverCategory, ['user', 'rcy']))

            ||

            // staff/system -> system (Nurse/Admin -> Super Admin, Admin <-> Nurse, etc.)
            (in_array($senderCategory, ['staff', 'system']) && $receiverCategory === 'system')
        );
    }
}
