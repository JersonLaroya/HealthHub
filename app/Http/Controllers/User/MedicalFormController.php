<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;

class MedicalFormController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $category = optional($user->userRole)->category;

        if (!in_array($category, ['user', 'rcy'])) {
            abort(403, 'You do not have access to medical forms.');
        }

        // Fetch all services from DB ordered by slug
        $services = Service::where('slug', '!=', 'clinic-consultation-record-form')
            ->orderBy('slug', 'desc')
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'title' => $service->title,
                    'slug' => $service->slug,
                    'description' => $service->description,
                ];
            });

        return Inertia::render('user/medicalForms/Index', [
            'patient' => [
                'name' => $user->name,
                'birthdate' => $user->birthdate,
                'sex' => $user->sex,
                'course' => $user->course,
                'year' => $user->yearLevel,
                'office' => $user->office,
                'category' => $category,
                'user_role' => $user->userRole,
            ],
            'assignments' => [
                'data' => $services, // pass sorted services
            ],
            'breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => route('user.dashboard')],
                ['title' => 'Medical Forms'],
            ],
        ]);
    }

    // New method to show a specific form
     public function show($slug, Request $request)
    {
        $user = $request->user();
        $category = optional($user->userRole)->category;

        if (!in_array($category, ['user', 'rcy'])) {
            abort(403, 'You do not have access to medical forms.');
        }

        // Handle Lab Results separately
        if ($slug === 'laboratory-results') {
            $service = (object) [
                'title' => 'Laboratory Results',
                'slug' => 'laboratory-results',
                'description' => null,
            ];
        } else {
            // Fetch from Service table
            $service = Service::where('slug', $slug)->firstOrFail();
        }

        return Inertia::render('user/medicalForms/ShowForm', [
            'service' => $service,
            'patient' => [
                'name' => $user->name,
                'birthdate' => $user->birthdate,
                'sex' => $user->sex,
                'course' => $user->course,
                'year' => $user->yearLevel,
                'office' => $user->office,
            ],
        ]);
    }
}
