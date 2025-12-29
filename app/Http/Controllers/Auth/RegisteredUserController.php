<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Office;
use App\Models\YearLevel;
use App\Models\Patient;
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
        $userRoles = UserRole::whereIn('name', ['Student', 'Staff', 'Faculty'])->get();
        $offices = Office::all(['id', 'name']);
        $courses = Course::all();
        $years = YearLevel::all(['id', 'name']);

        return Inertia::render('auth/register', [
            'userRoles' => $userRoles,
            'offices' => $offices,
            'courses' => $courses,
            'years' => $years,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
        'user_role_id' => 'required|exists:user_roles,id',
        'office_id' => 'required|exists:offices,id',

        'first_name' => 'required|string|max:255',
        'middle_name' => 'nullable|string|max:255',
        'last_name' => 'required|string|max:255',
        'suffix' => 'nullable|string|max:50',

        'sex' => 'required|in:M,F',
        'birthdate' => 'required|date',
        'contact_no' => 'required|string|max:20',

        'guardian_name' => 'nullable|string|max:255',
        'guardian_contact_no' => 'nullable|string|max:20',

        'email' => 'required|string|email|max:255|unique:users,email',
        'password' => ['required', Rules\Password::defaults()],

        'course_id' => 'nullable|exists:courses,id',
        'year_level_id' => 'nullable|exists:year_levels,id',
    ]);


        $userRole = UserRole::findOrFail($request->user_role_id);

        // Create the User
        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),

            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'suffix' => $request->suffix,

            'sex' => $request->sex,
            'birthdate' => $request->birthdate,
            'contact_no' => $request->contact_no,

            'guardian_name' => $request->guardian_name,
            'guardian_contact_no' => $request->guardian_contact_no,

            'user_role_id' => $userRole->id,
            'office_id' => $request->office_id,
            'course_id' => $request->course_id,
            'year_level_id' => $request->year_level_id,
        ]);

        // Create Patient record if role is Student/Staff/Faculty
        // if (in_array($userRole->name, ['Student', 'Staff', 'Faculty'])) {
        //     Patient::create([
        //         'user_id' => $user->id,
        //         'bp' => null,
        //         'rr' => null,
        //         'pr' => null,
        //         'temp' => null,
        //         'o2_sat' => null,
        //     ]);
        // }

        event(new Registered($user));
        // Auth::login($user);

        // return redirect()->route('user.dashboard');
        return back()->with('success', 'Account created successfully!');
    }
}
