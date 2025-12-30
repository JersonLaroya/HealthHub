<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Course;
use App\Models\Office;
use App\Models\Patient;
use App\Models\UserRole;
use App\Models\YearLevel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
   public function edit(Request $request): Response
{
    $user = $request->user()->load(['userRole', 'office']); // removed userInfo()
    $offices = Office::all(['id', 'name']);
    $courses = Course::all();
    $allRoles = UserRole::where('category', 'user')->get();
    $currentRole = $user->userRole;
    $years = YearLevel::all(['id', 'name']);

    // If the user is RCY, show as Student in the frontend
    if ($currentRole && $currentRole->category === 'rcy') {
        $currentRole->name = 'Student';
    }
    
    // Make sure the current role is included even if it's RCY
    if ($currentRole && $currentRole->category === 'rcy') {
        $roles = collect([$currentRole])->merge($allRoles);
    } else {
        $roles = $allRoles;
    }

    $component = match($user->userRole?->name) {
        'Admin'   => 'admin/profile',
        'Student' => 'user/profile',
        'Staff'   => 'user/profile',
        'Faculty' => 'user/profile',
        'Nurse'   => 'nurse/profile',
        default   => 'user/profile', 
    };

    return Inertia::render($component, [
        'user' => $user, // send user directly
        'offices' => $offices,
        'courses' => $courses,
        'years' => $years,
        'roles' => $roles,
        'currentRole' => $currentRole,
        'mustVerifyEmail' => $user instanceof MustVerifyEmail,
        'status' => $request->session()->get('status'),
    ]);
}

public function update(ProfileUpdateRequest $request): RedirectResponse
{
    $user = auth()->user();

    // If current role is RCY, prevent role change
    if ($user->userRole?->category === 'rcy') {
        $request->request->remove('user_role_id');
    }

    // Update directly on user table
    $user->fill($request->safe()->only([
        'first_name', 'middle_name', 'last_name', 'email', 'office_id', 'user_role_id', 'course_id', 'year_level_id'
    ]));

    // Only nullify course/year if the user is not a Student or RCY
    if (!in_array($user->userRole?->category, ['user', 'rcy'])) {
        $user->course_id = null;
        $user->year_level_id = null;
    }

    if ($user->isDirty('email')) {
        $user->email_verified_at = null;
    }

    $user->save();
    
    $userRoleName = $user->userRole->name;

    return match($userRoleName) {
        'Admin'   => to_route('admin.profile')->with('status', 'Profile updated successfully!'),
        //'Student' => to_route('user.profile')->with('status', 'Profile updated successfully!'),
        //'Staff'   => to_route('user.profile')->with('status', 'Profile updated successfully!'),
        //'Faculty' => to_route('user.profile')->with('status', 'Profile updated successfully!'),
        'Nurse'   => to_route('nurse.profile')->with('status', 'Profile updated successfully!'),
        default   => to_route('user.profile')->with('status', 'Profile updated successfully!'),
    };
}



    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
