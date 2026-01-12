<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Setting;
use Auth;
use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $category = optional($user->userRole)->category;

        if (!in_array($category, ['user', 'rcy'])) {
            abort(403, 'You do not have access to files.');
        }

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

        return Inertia::render('user/files/Index', [
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
                'data' => $services,
            ],
            'breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => route('user.dashboard')],
                ['title' => 'Files'],
            ],
        ]);
    }

    public function show($slug, Request $request)
    {
        $user = $request->user();
        $category = optional($user->userRole)->category;

        if (!in_array($category, ['user', 'rcy'])) {
            abort(403, 'You do not have access to files.');
        }

        if ($slug === 'laboratory-results') {
            $service = (object) [
                'title' => 'Laboratory Results',
                'slug' => 'laboratory-results',
                'description' => null,
            ];
        } else {
            $service = Service::where('slug', $slug)->firstOrFail();
        }

        $recordsQuery = Record::where('user_id', $user->id)
                            ->where('service_id', $service->id);

        // Only filter by current school year for pre-employment and athlete forms
        if (in_array($slug, ['pre-employment-health-form', 'athlete-medical'])) {
            $currentSchoolYear = Setting::first()?->school_year;
            $recordsQuery->whereJsonContains('response_data->school_year', $currentSchoolYear);
        }

        $records = $recordsQuery->get(['service_id', 'created_at'])
            ->map(function ($record) {
                return [
                    'service_id' => $record->service_id,
                    'slug'       => optional($record->service)->slug ?? null,
                    'created_at' => $record->created_at->toDateTimeString(),
                ];
            });

        return Inertia::render('user/files/ShowForm', [
            'service' => $service,
            'patient' => [
                'name' => $user->name,
                'birthdate' => $user->birthdate,
                'sex' => $user->sex,
                'course' => $user->course,
                'year' => $user->yearLevel,
                'office' => $user->office,
            ],
            'records' => $records,
        ]);
    }

    private function patientPayload($user)
    {
        $user->load([
            'homeAddress.barangay.municipality.province',
            'presentAddress.barangay.municipality.province',
        ]);

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
        return Inertia::render('user/files/preEnrollment/Page1', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage2()
    {
        return Inertia::render('user/files/preEnrollment/Page2', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage3()
    {
        return Inertia::render('user/files/preEnrollment/Page3', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage4()
    {
        return Inertia::render('user/files/preEnrollment/Page4', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage5()
    {
        return Inertia::render('user/files/preEnrollment/Page5', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage6()
    {
        return Inertia::render('user/files/preEnrollment/Page6', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preenrollmentPage7()
    {
        $user = auth()->user();
        $service = Service::where('slug', 'pre-enrollment-health-form')->first();

        $alreadySubmitted = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->exists();

        return Inertia::render('user/files/preEnrollment/Page7', [
            'patient' => $this->patientPayload($user),
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }

    public function preemploymentPage1()
    {
        return Inertia::render('user/files/preEmployment/Page1', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preemploymentPage2()
    {
        return Inertia::render('user/files/preEmployment/Page2', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preemploymentPage3()
    {
        return Inertia::render('user/files/preEmployment/Page3', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preemploymentPage4()
    {
        return Inertia::render('user/files/preEmployment/Page4', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function preemploymentPage5()
    {
        $user = auth()->user();
        $service = Service::where('slug', 'pre-employment-health-form')->first();
        $settings = Setting::first();
        $currentSchoolYear = $settings?->school_year;

        $alreadySubmitted = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->whereJsonContains('response_data->school_year', $currentSchoolYear)
            ->exists();

        return Inertia::render('user/files/preEmployment/Page5', [
            'patient' => $this->patientPayload($user),
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }

    public function athletePage1()
    {
        return Inertia::render('user/files/athlete/Page1', [
            'patient' => $this->patientPayload(auth()->user()),
        ]);
    }

    public function athletePage2() { return Inertia::render('user/files/athlete/Page2', ['patient' => $this->patientPayload(auth()->user())]); }
    public function athletePage3() { return Inertia::render('user/files/athlete/Page3', ['patient' => $this->patientPayload(auth()->user())]); }
    public function athletePage4() { return Inertia::render('user/files/athlete/Page4', ['patient' => $this->patientPayload(auth()->user())]); }
    public function athletePage5() { return Inertia::render('user/files/athlete/Page5', ['patient' => $this->patientPayload(auth()->user())]); }
    public function athletePage6()
    {
        $user = auth()->user();
        $service = Service::where('slug', 'athlete-medical')->first();
        $settings = Setting::first();
        $currentSchoolYear = $settings?->school_year;

        $alreadySubmitted = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->whereJsonContains('response_data->school_year', $currentSchoolYear)
            ->exists();

        return Inertia::render('user/files/athlete/Page6', [
            'patient' => $this->patientPayload($user),
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }


    public function previewPDF(Request $request)
{
    $allPagesData = json_decode($request->query('data'), true);

    if (!$allPagesData) {
        abort(400, 'No data provided for PDF.');
    }

    return response()->json($allPagesData);
}


    public function submitForm(Request $request, string $formType)
    {
        if (!in_array($formType, [
            'athlete-medical',
            'pre-enrollment-health-form',
            'pre-employment-health-form',
        ])) {
            abort(404);
        }

        $request->validate([
            'responses' => 'required|array',
        ]);

        // Get the first (and only) settings row
        $settings = Setting::first();

        $responses = $request->responses;

        // Add school_year to the responses
        $responses['school_year'] = $settings?->school_year ?? null;

        $service = Service::where('slug', $formType)->firstOrFail();

        Record::create([
            'user_id'         => Auth::id(),
            'service_id'      => $service->id,
            'consultation_id' => null,
            'lab_result_id'   => null,
            'response_data'   => $responses,
        ]);

        return redirect()->route('user.files.confirmation', [
            'slug' => $formType,
        ])->with('toast', [
            'title' => 'Form submitted',
            'message' => 'Your responses have been successfully saved.',
            'type' => 'success',
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
