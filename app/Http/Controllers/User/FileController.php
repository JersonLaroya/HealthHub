<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Setting;
use Auth;
use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;
use App\Models\Consultation;
use App\Models\VitalSign;
use App\Models\Disease;
use Illuminate\Support\Facades\Storage;
use App\Services\MedicalNotificationService;
use Carbon\Carbon;
use App\Models\User;
use App\Notifications\FormSubmitted;

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

        if ($slug === 'athlete-medical' && in_array(optional($user->userRole)->name, ['Staff', 'Faculty'])) {
            abort(403, 'Athlete form is not applicable for Staff or Faculty.');
        }

        if (!in_array($category, ['user', 'rcy'])) {
            abort(403, 'You do not have access to files.');
        }

        if ($slug === 'laboratory-results') {
            return redirect()->route('user.laboratory-results.index');
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

        $records = $records = $recordsQuery->get(['id', 'service_id', 'created_at', 'status'])
            ->map(function ($record) {
                return [
                    'id'         => $record->id,
                    'service_id' => $record->service_id,
                    'slug'       => optional($record->service)->slug ?? null,
                    'status'     => $record->status,
                    
                    // convert from UTC to Asia/Manila before sending to frontend
                    'created_at' => $record->created_at
                        ->setTimezone('Asia/Manila')
                        ->toDateTimeString(),
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
            'student_id'      => $user->ismis_id,
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

        $latest = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->latest()
            ->first();

        $alreadySubmitted = $latest && in_array($latest->status, ['pending', 'approved']);
        
        if ($alreadySubmitted) {
            return redirect()->route('user.files.show', 'athlete-medical');
        }

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

        $latest = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->whereJsonContains('response_data->school_year', $currentSchoolYear)
            ->latest()
            ->first();

        $alreadySubmitted = $latest && in_array($latest->status, ['pending', 'approved']);

        if ($alreadySubmitted) {
            return redirect()->route('user.files.show', 'athlete-medical');
        }

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

        $latest = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->whereJsonContains('response_data->school_year', $currentSchoolYear)
            ->latest()
            ->first();

        $alreadySubmitted = $latest && in_array($latest->status, ['pending', 'approved']);

        if ($alreadySubmitted) {
            return redirect()->route('user.files.show', 'athlete-medical');
        }

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

private function diseaseProblemsPage4(): array
{
    return [
        'Anemia/Blood Disorder',
        'Asthma',
        'Cancer',
        'Chickenpox',
        'Convulsions',
        'Dengue',
        'Diabetes',
        'Diphtheria',
        'Ear disease/defect',
        'Eye disease/defect',
        'Gonorrhea',
        'Heart disease',
        'Hepatitis (indicate type)',
        'Hernia',
        'High blood pressure',
        'Influenza (indicate date)',
        'Joint pains',
        'Kidney disease',
        'Malaria',
        'Measles',
        'Mental problem/disorder',
        'Mumps',
        'Neurologic problem/disorder',
        'Pertussis (whooping cough)',
        'Pleurisy',
        'Pneumonia',
        'Poliomyelitis',
        'Rheumatic fever',
        'Skin disease',
        'Syphilis',
        'Thyroid disease',
        'Tonsillitis',
        'Tuberculosis (Primary Complex)',
        'Typhoid',
        'Ulcer (peptic)',
        'Ulcer (skin)',
        'COVID-19',
        'Other conditions: please list',
    ];
}

private function mapPage4DiseaseToDbName(string $name): ?string
{
    $map = [
        'Anemia/Blood Disorder'        => 'Anemia',
        'Asthma'                       => 'Asthma',
        'Cancer'                       => 'Cancer',
        'Chickenpox'                   => 'Chicken Pox',
        'Convulsions'                  => 'Convulsions',
        'Dengue'                       => 'Dengue',
        'Diabetes'                     => 'Diabetes',
        'Diphtheria'                   => 'Diphtheria',
        'Ear disease/defect'           => 'Ear Disease/Defect',
        'Eye disease/defect'           => 'Eye Disease/Defect',
        'Gonorrhea'                    => 'Gonorrhea',
        'Heart disease'                => 'Heart Disease',
        'Hepatitis (indicate type)'    => 'Hepatitis',
        'Hernia'                       => 'Hernia',
        'High blood pressure'          => 'High Blood Pressure',
        'Influenza (indicate date)'    => 'Influenza',
        'Joint pains'                  => 'Joint Pain',
        'Kidney disease'               => 'Chronic Kidney Disease Stage 5', // or remove if unsure
        'Malaria'                      => 'Malaria',
        'Measles'                      => 'Measles',
        'Mental problem/disorder'      => 'Mental Problem/Disorder',
        'Neurologic problem/disorder'  => 'Neurologic Problem/Disorder',
        'Pertussis (whooping cough)'   => 'Pertussis',
        'Pneumonia'                    => 'Pneumonia',
        'Poliomyelitis'                => 'Poliomyelitis',
        'Rheumatic fever'              => 'Rheumatic fever',
        'Skin disease'                 => 'Skin Lesions',
        'Syphilis'                     => 'Syphilis',
        'Thyroid disease'              => 'Thyroid Disease',
        'Tonsillitis'                  => 'Tonsilitis (Suppurative)',
        'Tuberculosis (Primary Complex)' => 'Tuberculosis (Primary Complex)',
        'Typhoid'                      => 'Typhoid',
        'Ulcer (peptic)'               => 'Peptic Ulcer',
        'Ulcer (skin)'                 => 'Skin Lesions',
        'COVID-19'                     => 'COVID-19',
    ];

    return $map[$name] ?? null;
}


    public function submitForm(Request $request, string $formType)
    {
        if (
            $formType === 'athlete-medical' &&
            in_array(optional(auth()->user()->userRole)->name, ['Staff', 'Faculty'])
        ) {
            abort(403, 'Athlete form is not applicable for Staff or Faculty.');
        }
        if (!in_array($formType, [
            'athlete-medical',
            'pre-enrollment-health-form',
            'pre-employment-health-form',
        ])) {
            abort(404);
        }

        $responses = $request->responses;

        if (empty($responses) || !is_array($responses)) {
            abort(422, 'Athlete form submission is incomplete.');
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

        $currentSchoolYear = $settings?->school_year;

        $rejectedRecord = Record::where('user_id', Auth::id())
            ->where('service_id', $service->id)
            ->where('status', Record::STATUS_REJECTED)
            ->whereJsonContains('response_data->school_year', $currentSchoolYear)
            ->latest()
            ->first();

        if ($rejectedRecord) {
            // UPDATE rejected record
            $rejectedRecord->update([
                'response_data' => $responses,
                'status'        => Record::STATUS_PENDING,
            ]);

            $record = $rejectedRecord;
        } else {
            // CREATE new record
            $record = Record::create([
                'user_id'         => Auth::id(),
                'service_id'      => $service->id,
                'consultation_id' => null,
                'lab_result_id'   => null,
                'response_data'   => $responses,
                'status'          => Record::STATUS_PENDING,
            ]);
        }

        // notify Admin & Nurse
        $staff = User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->get();

        foreach ($staff as $user) {
            $user->notify(new FormSubmitted(
                $service->title,
                auth()->user()->name,
                auth()->id(),
                $service->slug,
                $record->id 
            ));
        }

        $diseasePage = $formType === 'pre-employment-health-form'
            ? ($responses['page3']['age_have'] ?? [])
            : ($responses['page4']['age_have'] ?? []);

        $hasDisease = false;

        if (!empty($diseasePage) && is_array($diseasePage)) {
            foreach ($diseasePage as $item) {
                // disease selected if NA exists and is false
                if (isset($item['na']) && $item['na'] === false) {
                    $hasDisease = true;
                    break;
                }
            }
        }

        if (
            in_array($formType, [
                'pre-enrollment-health-form',
                'pre-employment-health-form',
            ]) &&
            !$record->consultation_id &&
            $hasDisease
        ) {

            /* =========================
            CREATE VITAL SIGNS
            ========================= */
            $vital = VitalSign::create([
                'user_id' => Auth::id(),
                'bp' => null,
                'rr' => null,
                'pr' => null,
                'temp' => null,
                'o2_sat' => null,
                'height' => null,
                'weight' => null,
                'bmi' => null,
            ]);

            /* =========================
            CREATE CONSULTATION
            ========================= */
            $now = now('Asia/Manila');

            $consultation = Consultation::create([
                'patient_id'      => Auth::id(),
                'date'            => now()->toDateString(),
                'time'              => $now->format('H:i'),
                'vital_signs_id'  => $vital->id,
                'medical_complaint' => 'Initial record / consultation',
                'created_by'      => Auth::id(),
            ]);

            /* =========================
            CREATE CONSULTATION RECORD (PENDING)
            ========================= */
            $consultationServiceId = Service::where(
                'slug',
                'clinic-consultation-record-form'
            )->value('id');

            Record::create([
                'user_id'         => Auth::id(),
                'service_id'      => $consultationServiceId,
                'consultation_id' => $consultation->id,
                'status'          => Record::STATUS_PENDING,
            ]);

            /* =========================
            LINK FORM RECORD → CONSULTATION
            ========================= */
            $record->update([
                'consultation_id' => $consultation->id,
            ]);

            /* =========================
            ATTACH DISEASES
            ========================= */
            $diseasePage = $formType === 'pre-employment-health-form'
                ? ($responses['page3']['age_have'] ?? [])
                : ($responses['page4']['age_have'] ?? []);

            if (!empty($diseasePage)) {

                $diseaseLabels = $this->diseaseProblemsPage4();

                $selectedFrontendDiseases = collect($diseasePage)
                    ->map(function ($item, $index) use ($diseaseLabels) {
                        if (
                            isset($item['na']) &&
                            $item['na'] === false &&
                            isset($diseaseLabels[$index])
                        ) {
                            return $diseaseLabels[$index];
                        }
                        return null;
                    })
                    ->filter()
                    ->values()
                    ->toArray();

                $dbDiseaseNames = collect($selectedFrontendDiseases)
                    ->map(fn ($name) => $this->mapPage4DiseaseToDbName($name))
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();

                if (!empty($dbDiseaseNames)) {
                    $diseaseIds = Disease::whereIn('name', $dbDiseaseNames)
                        ->pluck('id')
                        ->toArray();

                    if (!empty($diseaseIds)) {
                        $consultation->diseases()->sync($diseaseIds);
                    }
                }
            }
        }

        // if ($formType === 'pre-employment-health-form') {
        //     auth()->user()->notifications()
        //         ->where('data->slug', 'pre-employment')
        //         ->delete();
        // }

        MedicalNotificationService::check(auth()->user());

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

        $record = Record::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->latest()
            ->first();

        if (!$record) {
            abort(404, 'No saved form found.');
        }

        $responses = $record->response_data;

        // Inject lab types from new tables
        if ($slug === 'laboratory-request-form') {
            $record->load('laboratoryRequestItems.laboratoryType');

            $responses['lab_types'] = $record->laboratoryRequestItems
                ->pluck('laboratoryType.name')
                ->values();
        }

        return response()->json([
            'responses' => $responses,
            'service' => [
                'title' => $service->title,
                'slug' => $service->slug,
            ],
        ]);
    }

    public function downloadLabRequest($recordId)
    {
        $user = auth()->user();

        $record = Record::with('laboratoryRequestItems.laboratoryType')
            ->where('id', $recordId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $labTypes = $record->laboratoryRequestItems
            ->pluck('laboratoryType.name')
            ->filter()
            ->values();

        return response()->json([
            'record_id' => $record->id,
            'patient_name' => $user->name,
            'date' => optional($record->created_at)->setTimezone('Asia/Manila')->format('m/d/Y'),
            'year_course_or_office' =>
                $user->course
                    ? ($user->course->code . ' ' . optional($user->yearLevel)->level)
                    : optional($user->office)->name,

            'remarks' => $record->remarks ?? null, // if you have
            'lab_types' => $labTypes, // from DB tables
        ]);
    }

    public function downloadByRecord($slug, $recordId)
    {
        $user = auth()->user();

        $service = Service::where('slug', $slug)->firstOrFail();

        $record = Record::where('id', $recordId)
            ->where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->firstOrFail();

        return response()->json([
            'responses' => $record->response_data,
            'service' => [
                'title' => $service->title,
                'slug' => $service->slug,
            ],
        ]);
    }

}
