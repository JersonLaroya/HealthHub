<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Support\Facades\Storage;
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
        $user = $request->user();

        if ($user->signature) {
            $user->signature = asset('storage/' . $user->signature);
        }

        $component = match($user->userRole?->name) {
            'Super Admin' => 'superAdmin/profile',
            'Admin'   => 'admin/profile',
            //'Student', 'Staff', 'Faculty' => 'user/profile',
            'Nurse'   => 'nurse/profile',
            default   => 'user/profile',
        };

        return Inertia::render($component, [
            'auth' => ['user' => $user],
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = auth()->user();

        $fillable = ['first_name', 'middle_name', 'last_name', 'email'];

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
