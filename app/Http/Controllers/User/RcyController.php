<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreRcyDtrRequest;
use App\Models\Consultation;
use App\Models\Disease;
use App\Models\Dtr;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RcyController extends Controller
{
    // Show form to add RCY DTR
    public function create()
    {
        $user = auth()->user();

        $diseases = Disease::all(['id', 'name']);

        return Inertia::render('user/rcy/Add', [
            'currentRole' => strtolower(str_replace(' ', '', $user->userRole->name)),
            'diseases' => $diseases,
        ]);
    }

    // Store new RCY DTR with vital signs and diseases
    public function store(StoreRcyDtrRequest $request, User $patient)
    {
        $user = auth()->user();

        // Create vital signs
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
            'date' => $request->dtr_date ?? now()->format('Y-m-d'),
            'time' => $request->dtr_time ?? now()->format('H:i'),
            'vital_signs_id' => $vitalSigns->id,
            'medical_complaint' => $request->purpose,
            'management_and_treatment' => $request->management,
            'created_by' => $user->id,
            'status' => 'pending',
        ]);

        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        return back()->with('success', 'Consultation added successfully.');
    }

    // Live search for patients
    public function searchPatients(Request $request)
    {
        $search = trim($request->input('q'));
        $terms = explode(' ', $search);

        $patients = User::whereHas('userRole', function ($q) {
                $q->whereIn(\DB::raw('LOWER(category)'), ['user', 'rcy']);
            })
            ->where(function ($q) use ($terms) {
                foreach ($terms as $term) {
                    $q->where(function ($q2) use ($term) {
                        $q2->where('first_name', 'ILIKE', "%{$term}%")
                           ->orWhere('last_name', 'ILIKE', "%{$term}%");
                    });
                }
            })
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim("{$user->first_name} " . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name),
                    'birthdate' => $user->birthdate,
                    'sex' => $user->sex,
                    'course' => $user->course?->code,
                    'yearLevel' => $user->yearLevel?->level,
                    'office' => $user->office?->name,
                ];
            });

        return response()->json($patients);
    }
}
