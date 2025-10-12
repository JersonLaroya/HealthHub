<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\UpdateConsultationRequest;
use App\Http\Requests\StoreConsultationRequest;
use App\Models\Patient;
use App\Models\Consultation;
use App\Models\RcyMember;
use Illuminate\Support\Facades\Auth;

class ConsultationController extends Controller
{
    /**
     * Store a new consultation for a patient.
     */
    public function store(StoreConsultationRequest $request, Patient $patient)
    {
        $user = $request->user();

        // Determine status
        $status = 'approved';
        if ($user->userRole->name === 'Student' && RcyMember::where('user_id', $user->id)->exists()) {
            $status = 'pending';
        }

        $patient->consultations()->create([
            'date' => $request->date,
            'time' => $request->time,
            'vital_signs' => $request->vital_signs,
            'chief_complaint' => $request->chief_complaint,
            'management_and_treatment' => $request->management_and_treatment,
            'submitted_by' => $user->id,
            'status' => $status,
        ]);

        return back()->with('success', 'Consultation added successfully.');
    }

    /**
     * Update an existing consultation.
     */
    public function update(UpdateConsultationRequest $request, Patient $patient, Consultation $consultation)
    {
        $consultation->update($request->validated());

        return back()->with('success', 'Consultation updated successfully.');
    }

    /**
     * Delete consultation.
     */
    public function destroy(Patient $patient, Consultation $consultation)
    {
        // Only admin or nurse can delete
        $userRole = Auth::user()->userRole->name;
        if ($userRole !== 'Admin') {
            abort(403, 'Unauthorized');
        }

        $consultation->delete();

        return back()->with('success', 'Consultation deleted successfully.');
    }
}
