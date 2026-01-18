<?php

namespace App\Services;

use App\Models\Record;
use App\Models\Setting;
use App\Notifications\MissingRequiredRecord;
use App\Notifications\MissingPersonalInfo;

class MedicalNotificationService
{
    public static function check($user): void
    {
        // ===== 1. PERSONAL INFO CHECK (FIRST) =====

        $hasPersonalInfo =
            $user->first_name &&
            $user->last_name &&
            $user->birthdate &&
            $user->sex &&
            $user->contact_no &&
            $user->signature &&
            $user->home_address_id &&
            $user->present_address_id;

        \Log::info('MedicalNotificationService check', [
    'user_id' => $user->id,
    'first_name' => $user->first_name,
    'last_name' => $user->last_name,
    'birthdate' => $user->birthdate,
    'sex' => $user->sex,
    'contact_no' => $user->contact_no,
    'signature' => $user->signature,
    'home_address_id' => $user->home_address_id,
    'present_address_id' => $user->present_address_id,
    'hasPersonalInfo' => $hasPersonalInfo,
]);

        if (! $hasPersonalInfo) {

            $already = $user->notifications()
                ->where('data->slug', 'personal-info')
                ->exists();

            if (! $already) {
                $user->notify(new MissingPersonalInfo());
            }

            // stop here — personal info must come first
            return;
        }

        // If personal info is complete, remove old personal-info notif
        $user->notifications()
            ->where('data->slug', 'personal-info')
            ->delete();

        $currentSY = Setting::value('school_year');
        if (! $currentSY) return;

        $role = $user->userRole?->name;
        $yearLevel = $user->yearLevel?->level;

        \Log::info('MedicalNotificationService role check', [
    'role' => $role,
    'yearLevel' => $yearLevel,
]);

        // ======================================================
        // STUDENT (FIRST YEAR) → PRE-ENROLLMENT REQUIRED
        // ======================================================
        if ($role === 'Student' && (int) $yearLevel === 1) {

            $exists = Record::where('user_id', $user->id)
                ->whereHas('service', fn ($q) =>
                    $q->where('slug', 'pre-enrollment-health-form')
                )
                ->where('response_data->school_year', $currentSY)
                ->exists();

            if (! $exists && ! self::alreadyNotified($user, 'pre-enrollment')) {
                $user->notify(new MissingRequiredRecord(
                    "You haven't submitted your Pre-Enrollment form for SY {$currentSY}.",
                    'pre-enrollment'
                ));
            }
        }

        // ======================================================
        // STAFF / FACULTY → PRE-EMPLOYMENT REQUIRED
        // ======================================================
        if (in_array($role, ['Staff', 'Faculty'])) {

            $exists = Record::where('user_id', $user->id)
                ->whereHas('service', fn ($q) =>
                    $q->where('slug', 'pre-employment-health-form')
                )
                ->where('response_data->school_year', $currentSY)
                ->exists();

            if (! $exists && ! self::alreadyNotified($user, 'pre-employment')) {
                $user->notify(new MissingRequiredRecord(
                    "You haven't submitted your Pre-Employment form for SY {$currentSY}.",
                    'pre-employment'
                ));
            }
        }
    }

    protected static function alreadyNotified($user, string $slug): bool
    {
        return $user->notifications()
            ->whereRaw("data->>'slug' = ?", [$slug]) // PostgreSQL safe
            ->exists();
    }
}
