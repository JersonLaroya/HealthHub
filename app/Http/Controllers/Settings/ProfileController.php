<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Course;
use App\Models\Office;
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
        // return Inertia::render('settings/profile', [
        //     'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
        //     'status' => $request->session()->get('status'),
        // ]);

        $user = $request->user()->load(['userRole', 'office', 'userInfo']);
        $offices = Office::all(['id', 'name']);
        $courses = Course::all();
        $roles = UserRole::whereIn('name', ['Staff', 'Student', 'Faculty'])->get();
        $years = YearLevel::all(['id', 'name']);
        

        $component = match($user->userRole?->name) {
            'Admin'   => 'admin/profile',
            'Student' => 'user/profile',
            'Staff'   => 'user/profile',
            'Faculty' => 'user/profile',
            'Nurse'   => 'nurse/profile',
            default   => 'user/profile', 
        };


    //     return Inertia::render($component, [
    //         'user' => $user,
    //         'mustVerifyEmail' => $user instanceof MustVerifyEmail,
    //         'status' => $request->session()->get('status'),
    //         ]
    // );

            return Inertia::render($component, [
                'auth' => [
                    'user' => $user,
                    'user_info' => $user->userInfo,
                ],
                'offices' => $offices,
                'courses' => $courses,
                'years' => $years,
                'roles' => $roles,
                'mustVerifyEmail' => $user instanceof MustVerifyEmail,
                'status' => $request->session()->get('status'),
            ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = auth()->user()->load('userInfo');


        // ✅ Update User table
        $user->fill($request->safe()->except('user_info'));

        if ($user->userRole?->name !== 'Student') {
            $user->course_id = null;
            $user->year_level_id = null;
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        // ✅ Update UserInfo table
        $user->userInfo()->update($request->input('user_info'));

        // Redirect based on role
        $userRoleName = $user->userRole->name;

        return match($userRoleName) {
            'Admin'   => to_route('admin.profile')->with('status', 'Profile updated successfully!'),
            'Student' => to_route('user.profile')->with('status', 'Profile updated successfully!'),
            'Staff'   => to_route('user.profile')->with('status', 'Profile updated successfully!'),
            'Faculty' => to_route('user.profile')->with('status', 'Profile updated successfully!'),
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
