<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserInfo;
use App\Models\UserRole;
use App\Models\Office;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        $userRoles = UserRole::where('name', '!=', 'Admin')->get();
        $offices = Office::all();

        return Inertia::render('auth/register', [
            'userRoles' => $userRoles,
            'offices' => $offices,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $defaultUserRole = UserRole::where('name', 'Student')->first();

        $request->validate([
            'office_id' => 'required|exists:offices,id',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:' . User::class,
            'password' => ['required', Rules\Password::defaults()],
        ]);

        // Create user first
        $user = User::create([
            'email' => $request->email,
            'user_role_id' => $defaultUserRole->id,
            'office_id' => $request->office_id,
            'password' => Hash::make($request->password),
        ]);

        // Create user_info
        UserInfo::create([
            'user_id' => $user->id,
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
        ]);

        // Automatically generate users.name in User model booted()
        // e.g., $user->name = trim(first + middle + last)

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

}
