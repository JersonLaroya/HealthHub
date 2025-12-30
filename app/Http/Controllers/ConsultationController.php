<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\UpdateConsultationRequest;
use App\Http\Requests\StoreConsultationRequest;
use App\Models\User;
use App\Models\Consultation;
use App\Models\RcyMember;
use App\Models\VitalSign;
use Illuminate\Support\Facades\Auth;

class ConsultationController extends Controller
{
    /**
     * Store a new consultation for a user (patient).
     */
    public function store(StoreConsultationRequest $request, User $patient)
    {

        $authUser = $request->user();

        $status = 'approved';
        if ($authUser->userRole->name === 'Student'
            && RcyMember::where('user_id', $authUser->id)->exists()) {
            $status = 'pending';
        }

        // Create vital signs snapshot
        $vitalSigns = VitalSign::create([
            'user_id' => $patient->id,
            'bp' => $request->bp,
            'rr' => $request->rr,
            'pr' => $request->pr,
            'temp' => $request->temp,
            'o2_sat' => $request->o2_sat,
        ]);

        // Create consultation
        $consultation = Consultation::create([
            'user_id' => $patient->id,
            'date' => $request->date,
            'time' => $request->time,
            'vital_signs_id' => $vitalSigns->id,
            'medical_complaint' => $request->medical_complaint,
            'management_and_treatment' => $request->management_and_treatment,
            'created_by' => $authUser->id,
            'status' => $status,
        ]);


        // Attach diseases (MULTIPLE)
        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        return back()->with('success', 'Consultation added successfully.');
    }

    /**
     * Update an existing consultation.
     */
    public function update(UpdateConsultationRequest $request, User $patient, Consultation $consultation)
    {
        $consultation->vitalSigns->update([
            'bp' => $request->bp,
            'rr' => $request->rr,
            'pr' => $request->pr,
            'temp' => $request->temp,
            'o2_sat' => $request->o2_sat,
        ]);

        $consultation->update([
            'date' => $request->date,
            'time' => $request->time,
            'medical_complaint' => $request->medical_complaint,
            'management_and_treatment' => $request->management_and_treatment,
        ]);

        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        return back()->with('success', 'Consultation updated successfully.');
    }


    /**
     * Delete a consultation.
     */
    public function destroy(User $patient, Consultation $consultation)
    {
        // Make sure the consultation belongs to the patient
        if ($consultation->user_id !== $patient->id) {
            abort(404);
        }

        $userRole = Auth::user()->userRole->name;
        if ($userRole !== 'Admin') {
            abort(403, 'Unauthorized');
        }

        $consultation->delete();

        return back()->with('success', 'Consultation deleted successfully.');
    }

    public function approve($patientId, Consultation $consultation)
    {
        // Only allow Admin or Nurse
        $role = auth()->user()->userRole->name;
        if (!in_array($role, ['Admin', 'Nurse'])) {
            abort(403);
        }

        if ($consultation->status === 'approved') {
            return back()->with('info', 'Consultation is already approved.');
        }

        $consultation->update([
            'status' => 'approved',
        ]);

        return back()->with('success', 'Consultation approved.');
    }


}
