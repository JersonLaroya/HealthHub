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
    $setting = Setting::firstOrCreate([], [
        'app_name' => 'HealthHub',
        'school_year' => null,
    ]);

    return Inertia::render('superAdmin/Settings/Index', [
        'settings' => $setting,
    ]);
}

public function update(Request $request)
{
    $setting = Setting::firstOrCreate([], [
        'app_name' => 'HealthHub',
        'school_year' => null,
    ]);

    $data = $request->validate([
        'app_name' => 'required|string|max:255',
        'school_year' => 'nullable|string|max:50',
        'app_logo' => 'nullable|image|max:2048',
        'clinic_logo' => 'nullable|image|max:2048',
    ]);

    unset($data['app_logo'], $data['clinic_logo']);

    if ($request->hasFile('app_logo')) {
        if ($setting->app_logo && Storage::disk('public')->exists($setting->app_logo)) {
            Storage::disk('public')->delete($setting->app_logo);
        }
        $data['app_logo'] = $request->file('app_logo')->store('settings', 'public');
    }

    if ($request->hasFile('clinic_logo')) {
        if ($setting->clinic_logo && Storage::disk('public')->exists($setting->clinic_logo)) {
            Storage::disk('public')->delete($setting->clinic_logo);
        }
        $data['clinic_logo'] = $request->file('clinic_logo')->store('settings', 'public');
    }

    $setting->update($data);

    return back()->with('success', 'System settings updated successfully.');
}
}
