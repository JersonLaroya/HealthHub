<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('admin/settings', [
            'settings' => Setting::first(),
        ]);
    }

    public function update(Request $request)
    {
        $settings = Setting::first();

        $data = $request->validate([
            'app_name' => 'required|string',
            'school_year' => 'nullable|string',
            'app_logo' => 'nullable|image',
            'clinic_logo' => 'nullable|image',
        ]);

        if ($request->hasFile('app_logo')) {
            $data['app_logo'] = $request->file('app_logo')
                ->store('logos', 'public');
        }

        if ($request->hasFile('clinic_logo')) {
            $data['clinic_logo'] = $request->file('clinic_logo')
                ->store('logos', 'public');
        }

        $settings->update($data);

        return back()->with('success', 'Settings updated');
    }
}
