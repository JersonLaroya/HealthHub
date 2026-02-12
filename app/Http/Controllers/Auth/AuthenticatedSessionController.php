<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // return redirect()->intended(route('dashboard', absolute: false));
        return redirect()->to($this->redirectTo());
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('login');
    }

    protected function redirectTo()
    {
        $user = auth()->user();
        if (! $user) {
            return route('home');
        }

        // Check if user profile is incomplete
        // if ((!$user->course_id && !$user->office_id) || ($user->course_id && !$user->year_level_id)) {
        //     // Redirect to profile settings with a flash message
        //     session()->flash('profile_incomplete', true);
        //     return route('profile.settings');
        // }

        $userRoleName = $user->userRole->name;

        return match ($userRoleName) {
            'Super Admin' => route('superadmin.dashboard'),
            'Admin' => route('admin.dashboard'),
            //'Student', 'Faculty', 'Staff' => route('user.dashboard'),
            'Nurse' => route('nurse.dashboard'),
            default => route('user.dashboard'),
        };
    }

}
