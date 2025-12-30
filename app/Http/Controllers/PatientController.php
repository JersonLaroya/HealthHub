<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePatientRequest;
use App\Models\Disease;
use App\Models\FormAssignment;
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
    public function forms(User $patient)
    {
        $formAssignments = FormAssignment::with(['form', 'response'])
            ->where('user_id', $patient->id) // changed from patient_id
            ->get();

        return inertia('patients/Forms', [
            'patient' => $patient,
            'assignedForms' => $formAssignments,
        ]);
    }
}
