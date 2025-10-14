<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePatientRequest;
use App\Models\FormAssignment;
use App\Models\Patient;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PatientController extends Controller
{
    /**
     * Display the list of patients (searchable).
     */
    public function index(Request $request)
    {
        $search = $request->input('q');

        $patients = Patient::with([
                'user.userInfo',
                'user.course',
                'user.yearLevel',
                'user.office'
            ])
            ->when($search, function ($query, $search) {
                $query->whereHas('user.userInfo', function ($q) use ($search) {
                    $q->where('first_name', 'ILIKE', "%{$search}%")
                    ->orWhere('last_name', 'ILIKE', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(10);

        return inertia('patients/Index', [
            'patients' => $patients,
            'filters' => ['q' => $search],
        ]);
    }

    /**
     * Show a single patient with consultation records.
     */
    public function show(Patient $patient)
    {
        $patient->load([
            'user.userInfo',
            'user.course',
            'user.yearLevel',
            'user.office',
            'user.userRole',
            'user.userInfo.homeAddress',
            'user.userInfo.presentAddress',
            'user.userInfo.guardian',
        ]);

        $consultations = $patient->consultations()
            ->orderBy('date')
            ->orderBy('time')
            ->paginate(10)
            ->withQueryString();

        return inertia('patients/Show', [
            'patient' => $patient,
            'consultations' => $consultations,
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $patient->update($request->validated());

        return redirect()->back()->with('success', 'Patient information updated successfully.');
    }

    public function downloadPDF(Patient $patient)
    {
        $consultations = $patient->consultations()->orderBy('date')->orderBy('time')->get();

        $pdf = Pdf::loadView('pdf.consultation', compact('patient', 'consultations'))
            ->setPaper('a4', 'portrait');

        //return $pdf->stream("Consultation_Record_{$patient->id}.pdf");
        return $pdf->stream("Consultation_Record_{$patient->id}.pdf");
    }

    public function forms(Patient $patient)
    {
        $patient->load(['user.userInfo', 'user.course', 'user.yearLevel', 'user.office']);

        $formAssignments = FormAssignment::with(['form', 'response'])
            ->where('patient_id', $patient->id)
            ->get();

        return inertia('patients/Forms', [
            'patient' => $patient,
            'assignedForms' => $formAssignments,
        ]);
    }

}
