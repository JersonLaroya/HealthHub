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

            'clinic_accomplishments_payload' => 'nullable|string',
            'homepage_services' => 'nullable|string',
            'healthcare_professionals_payload' => 'nullable|string',
            'healthhub_tour_payload' => 'nullable|string',
            'footer_content' => 'nullable|string',
        ]);

        unset(
            $data['app_logo'],
            $data['clinic_logo'],
            $data['clinic_accomplishments_payload'],
            $data['homepage_services'],
            $data['healthcare_professionals_payload'],
            $data['healthhub_tour_payload'],
            $data['footer_content']
        );

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

        $clinicAccomplishments = json_decode($request->input('clinic_accomplishments_payload', '[]'), true) ?? [];
        $homepageServices = json_decode($request->input('homepage_services', '[]'), true) ?? [];
        $healthcareProfessionals = json_decode($request->input('healthcare_professionals_payload', '[]'), true) ?? [];
        $healthhubTour = json_decode($request->input('healthhub_tour_payload', '[]'), true) ?? [];
        $footerContent = json_decode($request->input('footer_content', '{}'), true) ?? [];

        foreach ($clinicAccomplishments as $index => $item) {
            if ($request->hasFile("clinic_accomplishments.$index.cover_image")) {
                if (
                    !empty($item['cover_image_path']) &&
                    Storage::disk('public')->exists($item['cover_image_path'])
                ) {
                    Storage::disk('public')->delete($item['cover_image_path']);
                }

                $clinicAccomplishments[$index]['cover_image'] = $request
                    ->file("clinic_accomplishments.$index.cover_image")
                    ->store('settings/accomplishments', 'public');
            } else {
                $clinicAccomplishments[$index]['cover_image'] = $item['cover_image_path'] ?? null;
            }

            $savedGallery = $item['existing_images'] ?? [];

            if ($request->hasFile("clinic_accomplishments.$index.images")) {
                foreach ($request->file("clinic_accomplishments.$index.images") as $galleryFile) {
                    $savedGallery[] = $galleryFile->store('settings/accomplishments/gallery', 'public');
                }
            }

            $clinicAccomplishments[$index]['images'] = $savedGallery;

            unset(
                $clinicAccomplishments[$index]['cover_image_path'],
                $clinicAccomplishments[$index]['existing_images']
            );
        }

        foreach ($healthcareProfessionals as $index => $item) {
            if ($request->hasFile("healthcare_professionals.$index.image")) {
                if (
                    !empty($item['image_path']) &&
                    Storage::disk('public')->exists($item['image_path'])
                ) {
                    Storage::disk('public')->delete($item['image_path']);
                }

                $healthcareProfessionals[$index]['image'] = $request
                    ->file("healthcare_professionals.$index.image")
                    ->store('settings/professionals', 'public');
            } else {
                $healthcareProfessionals[$index]['image'] = $item['image_path'] ?? null;
            }

            unset($healthcareProfessionals[$index]['image_path']);
        }

        foreach ($healthhubTour as $index => $item) {
            if ($request->hasFile("healthhub_tour.$index.image")) {
                if (
                    !empty($item['image_path']) &&
                    Storage::disk('public')->exists($item['image_path'])
                ) {
                    Storage::disk('public')->delete($item['image_path']);
                }

                $healthhubTour[$index]['image'] = $request
                    ->file("healthhub_tour.$index.image")
                    ->store('settings/tour', 'public');
            } else {
                $healthhubTour[$index]['image'] = $item['image_path'] ?? null;
            }

            unset($healthhubTour[$index]['image_path']);
        }

        $data['clinic_accomplishments'] = $clinicAccomplishments;
        $data['homepage_services'] = $homepageServices;
        $data['healthcare_professionals'] = $healthcareProfessionals;
        $data['healthhub_tour'] = $healthhubTour;
        $data['footer_content'] = $footerContent;

        $setting->update($data);

        return back()->with('success', 'System settings updated successfully.');
    }
}