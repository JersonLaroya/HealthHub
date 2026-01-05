<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use Auth;
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

        // Fetch service from DB or handle special cases
        if ($slug === 'laboratory-results') {
            $service = (object) [
                'title' => 'Laboratory Results',
                'slug' => 'laboratory-results',
                'description' => null,
            ];
        } else {
            $service = Service::where('slug', $slug)->firstOrFail();
        }

        // Fetch all records of this user for this service (or all services if you want)
        $records = Record::where('user_id', $user->id)
            ->get(['service_id', 'created_at'])
            ->map(function ($record) {
                return [
                    'service_id' => $record->service_id,
                    'slug'       => optional($record->service)->slug ?? null,
                    'created_at' => $record->created_at->toDateTimeString(),
                ];
            });

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
            'records' => $records, // <-- pass the records to frontend
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
            'course'          => $user->course?->code ?? null,
            'year'            => $user->yearLevel?->level ?? null,
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

        $service = Service::where('slug', 'pre-enrollment-health-form')->first();

        // Check if the user has already submitted this form
        $alreadySubmitted = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->exists();

        return Inertia::render('user/medicalForms/preEnrollment/Page7', [
            'patient' => $this->patientPayload($user),
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }

    public function preemploymentPage1()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEmployment/Page1', [
            'patient' => $this->patientPayload($user),
        ]);
    }

    public function preemploymentPage2()
    {
        $user = auth()->user();

        return Inertia::render('user/medicalForms/preEmployment/Page2', [
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

    public function submitForm(Request $request, string $formType)
    {
        // Allowed form types
        if (!in_array($formType, ['athlete-medical', 'pre-enrollment-health-form', 'pre-employment-health-form'])) {
            abort(404);
        }

        $request->validate([
            'responses' => 'required|array',
        ]);

        // Find service by slug
        $service = Service::where('slug', $formType)->first();

        if (!$service) {
            abort(404, 'Service not found.');
        }

        Record::create([
            'user_id'        => Auth::id(),
            'service_id'     => $service->id,
            'consultation_id'=> null,
            'lab_result_id'  => null,
            'response_data'  => $request->responses,
        ]);

        // Redirect to the show page with a success message
        return redirect()->route('user.medical-forms.show', $formType)
                        ->with('toast', [
                            'title' => 'Form submitted',
                            'message' => 'Your responses have been successfully saved!',
                            'type' => 'success', // optional: success, error, info
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
        $user = auth()->user();

        $service = Service::where('slug', $slug)->firstOrFail();

        // Get the user's saved record for this service
        $record = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->latest() // in case multiple submissions
            ->first();

        if (!$record) {
            \Log::warning("Download failed: no saved form found", [
                'user_id' => $user->id,
                'service_slug' => $slug,
            ]);
            abort(404, 'No saved form found.');
        }

        $responses = $record->response_data;

         // Log the responses for debugging
        \Log::info("Download JSON data", [
            'user_id' => $user->id,
            'service_slug' => $slug,
            'responses' => $responses,
        ]);

        // Return JSON for frontend PDF-lib (if you want to generate client-side)
        return response()->json([
            'responses' => $responses,
            'service' => [
                'title' => $service->title,
                'slug' => $service->slug,
            ],
        ]);
    }

}
