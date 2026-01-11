<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePatientRequest;
use App\Models\Disease;
use App\Models\Record;
use App\Models\Service;
use Inertia\Inertia;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PatientController extends Controller
{
    /**
     * Display the list of users (patients) searchable.
     */
    public function index(Request $request)
    {
        $search = $request->input('q');

        $patients = User::with([
                'course',
                'yearLevel',
                'office'
            ])
            ->whereDoesntHave('userRole', function ($q) {
                $q->whereIn('name', ['Admin', 'Nurse', 'Super Admin']);
            })
            ->when($search, function ($query, $search) {
                $query->where('first_name', 'ILIKE', "%{$search}%")
                      ->orWhere('last_name', 'ILIKE', "%{$search}%");
            })
            ->orderByDesc('created_at')
            ->paginate(10);

        return inertia('patients/Index', [
            'patients' => $patients,
            'filters' => ['q' => $search],
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
            'vitalSign',
        ]);

        $consultations = $patient->consultations()
            ->with(['diseases', 'vitalSigns'])
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
        ]);
    }

    /**
     * Update user personal info (formerly patient info)
     */
    public function update(UpdatePatientRequest $request, User $user)
    {
        // Find the vital signs for this user
        $vitalSign = VitalSign::firstOrCreate(
            ['user_id' => $user->id], // If it doesn't exist, create one
            [] // default values if needed
        );

        // Update the vital signs with validated data
        $vitalSign->update($request->validated());

        return redirect()->back()->with('success', 'Vital signs updated successfully.');
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
        // Get the service ONLY for template + metadata
        $service = Service::where('slug', $slug)->firstOrFail();

        // Get records (actual filled data)
        $records = Record::where('user_id', $patient->id)
            ->where('service_id', $service->id)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'created_at',
                'response_data',
            ]);

        return Inertia::render('patients/ShowFile', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
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

        return back()->with('success', 'Record deleted successfully.');
    }



}
