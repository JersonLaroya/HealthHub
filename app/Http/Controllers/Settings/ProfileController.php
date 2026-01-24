<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Course;
use App\Models\Office;
use Illuminate\Support\Facades\Storage;
use App\Models\UserRole;
use App\Models\YearLevel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\MedicalNotificationService;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load(['userRole', 'office']);

        $canHaveSignature = $user->userRole?->name !== 'Super Admin';

        if ($canHaveSignature && $user->signature) {
            $user->signature = asset('storage/' . $user->signature);
        }

        $offices = Office::all(['id', 'name']);
        $courses = Course::all();
        $allRoles = UserRole::where('category', 'user')->get(); // Only 'user' category roles (Student, Staff, Faculty)
        $currentRole = $user->userRole;
        $years = YearLevel::all(['id', 'name']);

        
        $roles = $allRoles;

        $isRcy = $user->userRole?->category === 'rcy';

        $component = match($user->userRole?->name) {
            'Super Admin' => 'superadmin/profile',
            'Admin'   => 'admin/profile',
            'Student' => 'user/profile',
            'Staff'   => 'user/profile',
            'Faculty' => 'user/profile',
            'Nurse'   => 'nurse/profile',
            default   => 'user/profile', 
        };

        return Inertia::render($component, [
            'user' => $user,
            'offices' => $offices,
            'courses' => $courses,
            'years' => $years,
            'roles' => $roles,
            'currentRole' => $currentRole,
            'isRcy' => $isRcy,
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = auth()->user();

        $fillable = [
            'first_name', 'middle_name', 'last_name', 'email', 'office_id', 'course_id', 'year_level_id',
            // note: we will handle signature separately
        ];

        // Only allow role update if user is not RCY
        if ($request->has('user_role_id') && $this->userCanChangeRole()) {
            $fillable[] = 'user_role_id';
        }

        // Handle signature (base64 → file path)
        $canHaveSignature = $user->userRole?->name !== 'Super Admin';

        $signaturePath = $user->signature; // default to existing
        if ($canHaveSignature && $request->filled('signature') && str_starts_with($request->signature, 'data:image')) {

            // Delete old signature if exists
            if ($user->signature && Storage::disk('public')->exists($user->signature)) {
                Storage::disk('public')->delete($user->signature);
            }

            // Convert base64 to file
            if (preg_match('/^data:image\/(\w+);base64,/', $request->signature, $type)) {
                $dataBase64 = substr($request->signature, strpos($request->signature, ',') + 1);
                $dataBase64 = base64_decode($dataBase64);

                $extension = $type[1];
                $fileName = 'signature_' . $user->id . '_' . time() . '.' . $extension;
                $signaturePath = 'signatures/' . $fileName;

                Storage::disk('public')->makeDirectory('signatures');
                Storage::disk('public')->put($signaturePath, $dataBase64);
            }
        }

        // Fill other fields (excluding signature)
        $user->fill($request->safe()->only($fillable));

        // Assign signature path separately
        if ($canHaveSignature) {
            $user->signature = $signaturePath;
        }

        // Only nullify course/year if the user is not a Student or RCY
        if (!in_array($user->userRole?->category, ['user', 'rcy'])) {
            $user->course_id = null;
            $user->year_level_id = null;
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Re-check required medical notifications after profile update
        MedicalNotificationService::check($user);

        $userRoleName = $user->userRole->name;

        return match($userRoleName) {
            'Super Admin' => to_route('superadmin.profile')->with('status', 'Profile updated successfully!'),
            'Admin'   => to_route('admin.profile')->with('status', 'Profile updated successfully!'),
            'Nurse'   => to_route('nurse.profile')->with('status', 'Profile updated successfully!'),
            default   => to_route('user.profile')->with('status', 'Profile updated successfully!'),
        };
    }

    private function userCanChangeRole(): bool
    {
        $user = auth()->user();
        return !in_array($user->userRole?->category, ['rcy']); // RCY cannot change role
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
