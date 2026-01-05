<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use App\Models\UserRole;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        $googleUser = Socialite::driver('google')->user();

        $defaultUserRole = UserRole::where('name', 'Student')->first();
        $defaultOffice = Office::where('name', 'None')->first();

        // Check if user already exists
        $user = User::where('email', $googleUser->email)->first();

        if (!$user) {
            // Split Google name (first + last)
            $nameParts = explode(' ', $googleUser->name, 2);
            $firstName = $nameParts[0];
            $lastName = $nameParts[1] ?? '';

            // Create user
            $user = User::create([
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'user_role_id' => $defaultUserRole->id,
                'office_id' => $defaultOffice->id,
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'birthdate' => null, // temporary placeholder
            ]);
        } else {
            // Update existing user's Google tokens
            $user->update([
                'google_id' => $googleUser->id,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);
        }

        Auth::login($user);

        // Map role name to route
        $userRoleName = $user->userRole->name;
        $routeName = match ($userRoleName) {
            'Admin' => 'admin.dashboard',
            //'Student', 'Faculty', 'Staff' => 'user.dashboard',
            'Nurse' => 'nurse.dashboard',
            default => 'user.dashboard',
        };

        return redirect()->route($routeName);
    }
}
