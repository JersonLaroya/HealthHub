<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

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

    public function fillPreenrollment()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/PreEnrollmentForm', [
            'patient' => [
                'name' => $user->name,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'sex' => $user->sex,
                'birthdate' => $user->birthdate,
                'signature' => $user->signature,
            ],
        ]);
    }

    public function fillPreemployment()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/PreEmploymentForm', [
            'patient' => [
                'name' => $user->name,
                'sex' => $user->sex,
                'birthdate' => $user->birthdate,
            ],
        ]);
    }

    public function fillAthlete()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/AthleteForm', [
            'patient' => [
                'name' => $user->name,
                'sex' => $user->sex,
                'birthdate' => $user->birthdate,
            ],
        ]);
    }

    public function download($slug)
    {
        $service = Service::where('slug', $slug)->firstOrFail();

        // logic to generate PDF (using pdflib or dompdf)
        $pdf = Pdf::loadView('pdf.forms', ['service' => $service]);
        return $pdf->download($service->title . '.pdf');
    }

}
