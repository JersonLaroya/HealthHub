<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

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

    private function patientPayload($user)
    {
        $user->load([
            'homeAddress.barangay.municipality.province',
            'presentAddress.barangay.municipality.province',
        ]);

        // Helper function to build address
        $formatAddress = function ($address) {
            if (!$address) return null;

            $parts = [];
            if (!empty($address->purok)) $parts[] = $address->purok;
            if (!empty($address->street)) $parts[] = $address->street;
            if (!empty($address->barangay->name)) $parts[] = $address->barangay->name;
            if (!empty($address->barangay->municipality->name)) $parts[] = $address->barangay->municipality->name;
            if (!empty($address->barangay->municipality->province->name)) $parts[] = $address->barangay->municipality->province->name;

            return implode(', ', $parts);
        };

        return [
            'first_name'      => $user->first_name,
            'middle_name'     => $user->middle_name,
            'last_name'       => $user->last_name,
            'birthdate'       => $user->birthdate,
            'sex'             => $user->sex,
            'contact_no'      => $user->contact_no,
            'signature'       => $user->signature,
            'guardian_name'   => $user->guardian_name,
            'course'          => $user->course?->name ?? null,
            'year'            => $user->yearLevel?->name ?? null,
            'office'          => $user->office?->name ?? null,
            'category'        => optional($user->userRole)->category,
            'user_role'       => $user->userRole,
            'home_address'    => $formatAddress($user->homeAddress),
            'present_address' => $formatAddress($user->presentAddress),
        ];
    }

    public function preenrollmentPage1()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page1', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage2()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page2', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage3()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page3', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage4()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page4', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage5()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page5', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage6()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page6', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preenrollmentPage7()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEnrollment/Page7', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function previewPreEnrollmentPDF(Request $request)
    {
        // The data comes from the `data` query param (from page7)
        $allPagesData = json_decode($request->query('data'), true);

        if (!$allPagesData) {
            abort(400, 'No data provided for PDF.');
        }

        // Use your JS utility (preEnrollmentPDF.ts) via a Node build or run frontend side? 
        // In Laravel, you can generate PDF server-side using something like barryvdh/laravel-dompdf,
        // or keep PDF-lib in frontend. Here, we can simply return the JSON so frontend JS can generate PDF:

        return response()->json($allPagesData);

        // OR if you want server-side PDF, you can integrate PDF-lib with Laravel Vite build
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

public function getFormTemplate($slug)
{
    $service = Service::where('slug', $slug)->first();

    if (!$service || !$service->file_path) {
        return response('PDF template not found', 404);
    }

    // Use the 'public' disk
    if (!\Storage::disk('public')->exists($service->file_path)) {
        \Log::warning("PDF file missing on server: slug={$slug}, path={$service->file_path}");
        return response('PDF template not found on server', 404);
    }

    $pdfBytes = \Storage::disk('public')->get($service->file_path);

    return response($pdfBytes)->header('Content-Type', 'application/pdf');
}

    public function download($slug)
    {
        $service = Service::where('slug', $slug)->firstOrFail();

        // logic to generate PDF (using pdflib or dompdf)
        $pdf = Pdf::loadView('pdf.forms', ['service' => $service]);
        return $pdf->download($service->title . '.pdf');
    }

}
