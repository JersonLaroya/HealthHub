<?php

namespace App\Services;

use App\Models\User;

class ChatService
{
    public static function canMessage(User $sender, User $receiver): bool
    {
        $senderRole       = strtolower($sender->userRole->name ?? '');
        $receiverRole     = strtolower($receiver->userRole->name ?? '');

        $senderCategory   = strtolower($sender->userRole->category ?? '');
        $receiverCategory = strtolower($receiver->userRole->category ?? '');

        if (!$senderRole || !$senderCategory || !$receiverRole || !$receiverCategory) {
            return false;
        }

        $isSuperAdmin = fn($r) => $r === 'super admin';
        $isAdmin      = fn($r) => $r === 'admin';
        $isNurse      = fn($r) => $r === 'nurse';

        /*
        |-------------------------
        | Super Admin
        |-------------------------
        */
        if ($isSuperAdmin($senderRole)) {
            return $isAdmin($receiverRole) || $isNurse($receiverRole);
        }

        /*
        |-------------------------
        | Admin
        |-------------------------
        */
        if ($isAdmin($senderRole)) {
            return $isSuperAdmin($receiverRole)
                || in_array($receiverCategory, ['user', 'rcy']);
        }

        /*
        |-------------------------
        | Nurse
        |-------------------------
        */
        if ($isNurse($senderRole)) {
            return $isSuperAdmin($receiverRole)
                || in_array($receiverCategory, ['user', 'rcy']);
        }

        /*
        |-------------------------
        | user / rcy
        |-------------------------
        */
        if (in_array($senderCategory, ['user', 'rcy'])) {
            return $isAdmin($receiverRole) || $isNurse($receiverRole);
        }

        return false;
    }
}
