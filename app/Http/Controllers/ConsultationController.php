<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\UpdateConsultationRequest;
use App\Http\Requests\StoreConsultationRequest;
use App\Models\Record;
use App\Models\Service;
use App\Models\User;
use App\Models\Consultation;
use App\Models\RcyMember;
use App\Models\VitalSign;
use Illuminate\Support\Facades\Auth;
use App\Events\ConsultationApproved;

class ConsultationController extends Controller
{
    /**
     * Store a new consultation for a user (patient).
     */
    public function store(StoreConsultationRequest $request, User $patient)
    {
        $authUser = $request->user();

        $status = 'approved';

        // Create vital signs snapshot
        $vitalSigns = VitalSign::create([
            'user_id' => $patient->id,
            'bp' => $request->bp,
            'rr' => $request->rr,
            'pr' => $request->pr,
            'temp' => $request->temp,
            'o2_sat' => $request->o2_sat,
            'height' => $request->height,
            'weight' => $request->weight,
            'bmi' => $request->bmi,
        ]);

        // Create consultation
        $consultation = Consultation::create([
            'patient_id' => $patient->id,
            'date' => $request->date,
            'time' => $request->time,
            'vital_signs_id' => $vitalSigns->id,
            'medical_complaint' => $request->medical_complaint,
            'management_and_treatment' => $request->management_and_treatment,
            'created_by' => $authUser->id,
            'updated_by' => $authUser->id,
            //'status' => $status,
        ]);

        // Attach diseases (MULTIPLE)
        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        // Attach treatments (MULTIPLE)
        if ($request->filled('treatment_ids')) {
            $consultation->treatments()->sync($request->treatment_ids);
        }

        // --- NEW: Create record for this consultation form ---
        $service = Service::where('slug', 'clinic-consultation-record-form')->first();
        if ($service) {
            Record::create([
                'user_id' => $patient->id,
                'consultation_id' => $consultation->id,
                'service_id' => $service->id,
                'response_data' => json_encode([]), // empty response initially
                'status' => Record::STATUS_APPROVED,
            ]);
        }

        return back()->with('success', 'Consultation added successfully.');
    }

    /**
     * Update an existing consultation.
     */
    public function update(UpdateConsultationRequest $request, User $patient, Consultation $consultation)
    {
        if ($consultation->vitalSigns) {
            $consultation->vitalSigns->update([
                'bp' => $request->bp,
                'rr' => $request->rr,
                'pr' => $request->pr,
                'temp' => $request->temp,
                'o2_sat' => $request->o2_sat,
                'height' => $request->height,
                'weight' => $request->weight,
                'bmi' => $request->bmi,
            ]);
        }

        $consultation->update([
            'date' => $request->date,
            'time' => $request->time,
            'medical_complaint' => $request->medical_complaint,
            'management_and_treatment' => $request->management_and_treatment,
            'updated_by' => auth()->id(),
        ]);

        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        if ($request->filled('treatment_ids')) {
            $consultation->treatments()->sync($request->treatment_ids);
        }

        return back()->with('success', 'Consultation updated successfully.');
    }


    /**
     * Delete a consultation.
     */
    public function destroy(User $patient, Consultation $consultation)
    {
        // Make sure the consultation belongs to the patient
        if ($consultation->patient_id !== $patient->id) {
            abort(404);
        }

        $userRole = Auth::user()->userRole->name;
        if ($userRole !== 'Admin') {
            abort(403, 'Unauthorized');
        }

        // Delete related records
        Record::where('consultation_id', $consultation->id)->delete();

        // Delete consultation
        $consultation->delete();

        // Delete the notification
        User::whereHas('notifications', function ($q) use ($consultation) {
            $q->whereRaw("data->>'slug' = ?", ['rcy-consultation'])
            ->whereRaw("data->>'consultation_id' = ?", [(string) $consultation->id]);
        })->each(function ($user) use ($consultation) {
            $user->notifications()
                ->whereRaw("data->>'slug' = ?", ['rcy-consultation'])
                ->whereRaw("data->>'consultation_id' = ?", [(string) $consultation->id])
                ->delete();
        });

        return back()->with('success', 'Consultation deleted successfully.');
    }

    public function approve($patientId, Consultation $consultation)
    {
        // Only allow Admin or Nurse
        $role = auth()->user()->userRole->name;
        if (!in_array($role, ['Admin', 'Nurse'])) {
            abort(403);
        }

        $record = Record::where('consultation_id', $consultation->id)
            ->whereHas('service', fn ($q) =>
                $q->where('slug', 'clinic-consultation-record-form')
            )
            ->latest()
            ->first();

        if ($record && $record->status === Record::STATUS_APPROVED) {
            return back()->with('info', 'Consultation is already approved.');
        }

        // if ($consultation->status === 'approved') {
        //     return back()->with('info', 'Consultation is already approved.');
        // }

        $record = Record::where('consultation_id', $consultation->id)
            ->whereHas('service', fn ($q) =>
                $q->where('slug', 'clinic-consultation-record-form')
            )
            ->latest()
            ->first();

        if (!$record) {
            abort(404, 'Consultation record not found.');
        }

        if ($record->status === Record::STATUS_APPROVED) {
            return back()->with('info', 'Consultation is already approved.');
        }

        $record->update([
            'status' => Record::STATUS_APPROVED,
        ]);

        event(new ConsultationApproved($consultation->patient_id, $consultation->id));
        
        // mark the notification as read for both Admin and Nurse
        User::whereHas('userRole', function ($q) {
            $q->whereIn('name', ['Admin', 'Nurse']);
        })->each(function ($user) use ($consultation) {

            $user->unreadNotifications()
                ->whereRaw("data->>'slug' = ?", ['rcy-consultation'])
                ->whereRaw("data->>'consultation_id' = ?", [(string) $consultation->id])
                ->update(['read_at' => now()]);
        });

        return back()->with('success', 'Consultation approved.');
    }


}
