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

        $diseases = Disease::select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('user/rcy/Add', [
            'currentRole' => strtolower(str_replace(' ', '', $user->userRole->name)),
            'diseases' => $diseases,
        ]);
    }

    // Store new RCY DTR with vital signs and diseases
    public function store(StoreRcyDtrRequest $request, User $patient)
    {
        $authUser = $request->user();

        $status = 'pending';

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
            'user_id' => $patient->id,
            'date' => $request->date,
            'time' => $request->time,
            'vital_signs_id' => $vitalSigns->id,
            'medical_complaint' => $request->medical_complaint,
            'management_and_treatment' => $request->management_and_treatment,
            'created_by' => $authUser->id,
            'status' => $status,
        ]);

        // Attach diseases (same as clinic side)
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

    $patients = User::with(['course:id,code', 'yearLevel:id,level', 'office:id,name'])
        ->whereHas('userRole', function ($q) {
            $q->whereIn(\DB::raw('LOWER(category)'), ['user', 'rcy']);
        })
        ->where(function ($q) use ($terms) {
            foreach ($terms as $term) {
                $q->where(function ($q2) use ($term) {
                    $q2->whereRaw('LOWER(first_name) LIKE ?', ["%".strtolower($term)."%"])
                       ->orWhereRaw('LOWER(last_name) LIKE ?', ["%".strtolower($term)."%"]);
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
