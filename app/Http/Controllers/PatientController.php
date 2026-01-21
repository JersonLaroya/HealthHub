<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePatientRequest;
use App\Models\Disease;
use App\Models\Record;
use App\Models\Service;
use Inertia\Inertia;
use App\Models\User;
use App\Models\VitalSign;
use App\Models\Setting;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\LabResult;
use Illuminate\Support\Facades\Storage;
use App\Services\MedicalNotificationService;

class PatientController extends Controller
{
    /**
     * Display the list of users (patients) searchable.
     */
    public function index(Request $request)
    {
        $search = $request->input('q');
        $courseId = $request->input('course');
        $yearId = $request->input('year');
        $officeId = $request->input('office');

        $patients = User::with(['course', 'yearLevel', 'office', 'userRole'])
            ->whereDoesntHave('userRole', function ($q) {
                $q->whereIn('name', ['Admin', 'Nurse', 'Super Admin']);
            })

            // text search
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'ILIKE', "%{$search}%")
                    ->orWhere('last_name', 'ILIKE', "%{$search}%")
                    ->orWhereHas('course', fn ($c) => $c->where('name', 'ILIKE', "%{$search}%"))
                    ->orWhereHas('yearLevel', fn ($y) => $y->where('name', 'ILIKE', "%{$search}%"))
                    ->orWhereHas('office', fn ($o) => $o->where('name', 'ILIKE', "%{$search}%"));
                });
            })

            // dropdown filters
            ->when($courseId, fn ($q) => $q->where('course_id', $courseId))
            ->when($yearId, fn ($q) => $q->where('year_level_id', $yearId))
            ->when($officeId, fn ($q) => $q->where('office_id', $officeId))

            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return inertia('patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['q', 'course', 'year', 'office']),
            'courses' => \App\Models\Course::orderBy('name')->get(['id','name']),
            'years' => \App\Models\YearLevel::orderBy('name')->get(['id','name']),
            'offices' => \App\Models\Office::orderBy('name')->get(['id','name']),
        ]);
    }

    /**
     * Show a single patient (user) with consultations and vital signs.
     */
    public function show(User $patient)
    {
        $patient->load([
            'course',
            'yearLevel',
            'office',
            'userRole',
            'homeAddress.barangay.municipality.province',
            'presentAddress.barangay.municipality.province',
            'vitalSign' => function ($q) {
                $q->whereNotNull('blood_type')
                    ->orderBy('created_at', 'asc') // first baseline record
                    ->limit(1);
            },
        ]);

        $schoolYear = Setting::value('school_year');

        $consultations = $patient->consultations()
            ->with([
                'diseases',
                'vitalSigns',
                'creator:id,first_name,last_name',
                'updater:id,first_name,last_name',
            ])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->paginate(10)
            ->withQueryString();

        $diseases = Disease::orderBy('name')->get();

        return inertia('patients/Show', [
            'patient' => $patient,
            'consultations' => $consultations,
            'diseases' => $diseases,
            'schoolYear' => $schoolYear,
        ]);
    }

    /**
     * Update user personal info (formerly patient info)
     */
    public function update(UpdatePatientRequest $request, User $patient)
    {
        $data = $request->validated();

        if (!empty($data['vital_sign_id'])) {
            // Update the SAME vital sign coming from Show()
            $vitalSign = VitalSign::where('id', $data['vital_sign_id'])
                ->where('user_id', $patient->id)
                ->firstOrFail();
        } else {
            // Only create if none exists yet
            $vitalSign = VitalSign::create([
                'user_id' => $patient->id,
            ]);
        }

        // never mass-assign IDs
        unset($data['vital_sign_id'], $data['user_id']);

        $vitalSign->update($data);

        return back()->with('success', 'Vital signs updated successfully.');
    }

    /**
     * Download consultations PDF for a patient.
     */
    public function downloadPDF(User $patient)
    {
        $consultations = $patient->consultations()
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        $pdf = Pdf::loadView('pdf.consultation', compact('patient', 'consultations'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream("Consultation_Record_{$patient->id}.pdf");
    }

    /**
     * List forms assigned to the user/patient
     */
    // public function forms(User $patient)
    // {
    //     $formAssignments = FormAssignment::with(['form', 'response'])
    //         ->where('user_id', $patient->id) // changed from patient_id
    //         ->get();

    //     return inertia('patients/Forms', [
    //         'patient' => $patient,
    //         'assignedForms' => $formAssignments,
    //     ]);
    // }

    public function files(User $patient)
    {
        $category = optional($patient->userRole)->category;

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

        return Inertia::render('patients/Files', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'birthdate' => $patient->birthdate,
                'sex' => $patient->sex,
                'course' => $patient->course,
                'year' => $patient->yearLevel,
                'office' => $patient->office,
                'category' => $category,
                'user_role' => $patient->userRole,
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

    public function showFile(User $patient, string $slug)
    {
        // LAB RESULTS (special handling)
        if ($slug === 'laboratory-results') {

            $labService = Service::where('slug', 'laboratory-request-form')->firstOrFail();

            $records = Record::where('user_id', $patient->id)
                ->where('service_id', $labService->id)   // only lab requests
                ->with('labResult:id,results')            // preload images
                ->orderByDesc('created_at')
                ->get(['id', 'created_at', 'lab_result_id', 'response_data']); // ✅ keep reasons

            return Inertia::render('patients/labResults/Index', [
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                ],
                'records' => $records,
            ]);
        }

        // NORMAL FORMS (existing behavior)
        $service = Service::where('slug', $slug)->firstOrFail();

        // Get records (actual filled data)
        $records = Record::where('user_id', $patient->id)
            ->where('service_id', $service->id)
            ->orderBy('created_at')
            ->get([
                'id',
                'created_at',
                'response_data',
            ]);

        return Inertia::render('patients/ShowFile', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'course' => $patient->course,
                'year' => $patient->yearLevel,
                'office' => $patient->office,
            ],
            'service' => [
                'id' => $service->id,
                'title' => $service->title,
                'slug' => $service->slug,
            ],
            'records' => $records,
        ]);
    }

    public function viewRecord(User $patient, string $slug, Record $record)
    {
        $service = Service::where('slug', $slug)->firstOrFail();

        abort_if(
            $record->user_id !== $patient->id ||
            $record->service_id !== $service->id,
            403
        );

        return response()->json([
            'service' => [
                'slug' => $service->slug,
                'file_path' => $service->file_path,
            ],
            'responses' => $record->response_data,
        ]);
    }

    public function updateRecord(User $patient, string $slug, Record $record, Request $request)
    {
        abort_if($record->user_id !== $patient->id, 403);

        $request->validate([
            'responses' => 'required|array',
        ]);

        $record->update([
            'response_data' => $request->responses,
        ]);

        return back()->with('success', 'Record updated successfully.');
    }



    public function deleteRecord(User $patient, string $slug, $recordId)
    {
        $record = Record::where('id', $recordId)
            ->where('user_id', $patient->id)
            ->firstOrFail();

        $record->delete();

        // Re-check medical requirements and fire notifications again
        MedicalNotificationService::check($patient);

        return back()->with('success', 'Record deleted successfully.');
    }

    public function deleteLabResult(Record $record)
    {
        abort_if(!in_array(auth()->user()->userRole->name, ['Admin', 'Nurse']), 403);

        if (!$record->lab_result_id) {
            return back()->withErrors(['lab' => 'No laboratory result found.']);
        }

        $labResult = $record->labResult;
        abort_if(!$labResult, 404);

        // delete stored images
        foreach ($labResult->results ?? [] as $images) {
            foreach ($images as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        // delete lab_results row
        $labResult->delete();

        // unlink from record
        $record->update([
            'lab_result_id' => null,
        ]);

        // Re-check medical requirements and fire notifications again
        MedicalNotificationService::check($record->user);

        return back()->with('success', 'Laboratory result deleted successfully.');
    }

}
