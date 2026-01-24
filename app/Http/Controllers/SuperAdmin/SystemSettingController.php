<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    public function index()
    {
        return Inertia::render('superAdmin/Settings/Index', [
            'settings' => Setting::first(),
        ]);
    }

    public function update(Request $request)
    {
        $setting = Setting::first();

        $data = $request->validate([
            'app_name' => 'required|string|max:255',
            'school_year' => 'nullable|string|max:50',
            'app_logo' => 'nullable|image|max:2048',
            'clinic_logo' => 'nullable|image|max:2048',
        ]);

        // remove file fields first
        unset($data['app_logo'], $data['clinic_logo']);

        if ($request->hasFile('app_logo')) {

            // delete old app logo
            if ($setting->app_logo && Storage::disk('public')->exists($setting->app_logo)) {
                Storage::disk('public')->delete($setting->app_logo);
            }

            // store new one
            $data['app_logo'] = $request->file('app_logo')->store('settings', 'public');
        }

        if ($request->hasFile('clinic_logo')) {

            // delete old clinic logo
            if ($setting->clinic_logo && Storage::disk('public')->exists($setting->clinic_logo)) {
                Storage::disk('public')->delete($setting->clinic_logo);
            }

            // store new one
            $data['clinic_logo'] = $request->file('clinic_logo')->store('settings', 'public');
        }

        $setting->update($data);

        return back()->with('success', 'System settings updated successfully.');
    }
}
