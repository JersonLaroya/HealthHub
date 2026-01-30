<?php

namespace App\Http\Controllers\User;

use App\Events\RcyInquiryCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreRcyDtrRequest;
use App\Models\Consultation;
use App\Models\Disease;
use App\Models\Inquiry;
use App\Models\ListOfInquiry;
use App\Models\User;
use App\Models\VitalSign;
use App\Notifications\RcyInquirySubmitted;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\RcyConsultationSubmitted;
use App\Events\RcyConsultationCreated;

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
            'created_by' => $authUser->id,
            'status' => $status,
        ]);

        // Attach diseases (same as clinic side)
        if ($request->filled('disease_ids')) {
            $consultation->diseases()->sync($request->disease_ids);
        }

        // Event for auto show in Show.tsx
        event(new RcyConsultationCreated($patient->id));

        // ======================================================
        // Notify Admins: RCY consultation pending approval
        // ======================================================

        $rcyName = trim($authUser->first_name . ' ' . $authUser->last_name);
        $patientName = trim($patient->first_name . ' ' . $patient->last_name);

        // Get all admins and Nurses
        $staff = User::whereHas('userRole', function ($q) {
            $q->whereIn('name', ['Admin', 'Nurse']);
        })->get();

        foreach ($staff as $user) {

            // choose URL based on role
            $prefix = strtolower(str_replace(' ', '', $user->userRole->name)); 
            // admin / nurse / superadmin (if you use it)

            $user->notify(new RcyConsultationSubmitted(
                title: 'Consultation Pending Approval',
                message: "RCY member {$rcyName} submitted a consultation for {$patientName}. Please review and approve.",
                url: "/{$prefix}/patients/{$patient->id}?consultation={$consultation->id}",
                slug: "rcy-consultation",
                consultationId: $consultation->id
            ));
        }

        return back()->with('success', 'Consultation added successfully.');
    }

    public function inquiries()
    {
        return Inertia::render('user/rcy/Inquiries', [
            'inquiryTypes' => ListOfInquiry::orderBy('name')->get(),
            'breadcrumbs' => [
                ['title' => 'RCY', 'href' => '/user/rcy'],
                ['title' => 'Inquiries'],
            ],
        ]);
    }

    public function storeInquiry(Request $request, User $patient)
    {
        $data = $request->validate([
            'inquiry_type_ids' => 'required|array|min:1',
            'inquiry_type_ids.*' => 'exists:list_of_inquiries,id',
            'description' => 'nullable|string',
        ]);

        $authUser = $request->user();

        $inquiry = Inquiry::create([
            'user_id' => $patient->id,
            'created_by' => $authUser->id,
            'description' => $data['description'] ?? null,
            'status' => 'pending',
        ]);

        $inquiry->inquiryTypes()->sync($data['inquiry_type_ids']);

        // THIS is the important line
        event(new RcyInquiryCreated($patient->id, $inquiry->id));

        // notify Admin & Nurse
        $staff = User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->get();

        foreach ($staff as $user) {
            $prefix = strtolower($user->userRole->name);

            $user->notify(new RcyInquirySubmitted(
                title: 'Inquiry Pending Approval',
                message: "RCY submitted an inquiry.",
                url: "/{$prefix}/patients/{$patient->id}/inquiries",
                slug: 'rcy-inquiry',
                inquiryId: $inquiry->id 
            ));
        }

        return back()->with('success', 'Inquiry added successfully.');
    }


    // Live search for patients
    public function searchPatients(Request $request)
    {
        $search = strtolower(trim($request->input('q', '')));
        $page = max((int) $request->input('page', 1), 1);
        $perPage = 10;
        $offset = ($page - 1) * $perPage;

        if (strlen($search) < 2) {
            return response()->json([
                'data' => [],
                'has_more' => false,
                'next_page' => null,
            ]);
        }

        $isNumeric = ctype_digit(str_replace('-', '', $search));

        $query = User::query()
            ->select('id','first_name','middle_name','last_name','birthdate','sex','email','course_id','year_level_id','office_id')
            ->with(['course:id,code', 'yearLevel:id,level', 'office:id,name'])
            ->whereHas('userRole', function ($q) {
                $q->whereIn(\DB::raw('LOWER(category)'), ['user', 'rcy']);
            })
            ->where(function ($q) use ($search, $isNumeric) {

                if ($isNumeric) {
                    // numeric-like → search ISMIS + fallback to names
                    $q->where('ismis_id', 'LIKE', "%{$search}%")
                    ->orWhereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw("LOWER(CONCAT(first_name,' ',last_name)) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) LIKE ?", ["%{$search}%"]);
                } else {
                    // text-like → names only
                    $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw("LOWER(CONCAT(first_name,' ',last_name)) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) LIKE ?", ["%{$search}%"]);
                }
            });

        // 🔹 Smart ordering (exact matches first)
        $query->orderByRaw("
            CASE
                WHEN LOWER(CONCAT(first_name,' ',last_name)) = ? THEN 0
                WHEN LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) = ? THEN 1
                WHEN LOWER(first_name) = ? THEN 2
                WHEN LOWER(last_name) = ? THEN 3
                ELSE 4
            END
        ", [$search, $search, $search, $search])
        ->orderBy('id');

        $patients = $query
            ->offset($offset)
            ->limit($perPage + 1)
            ->get();

        $hasMore = $patients->count() > $perPage;

        $patients = $patients->take($perPage)->map(fn($user) => [
            'id' => $user->id,
            'name' => trim("{$user->first_name} " . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->last_name),
            'birthdate' => $user->birthdate,
            'sex' => $user->sex,
            'email' => $user->email,
            'course' => $user->course?->code,
            'yearLevel' => $user->yearLevel?->level,
            'office' => $user->office?->name,
        ]);

        return response()->json([
            'data' => $patients->values(),
            'has_more' => $hasMore,
            'next_page' => $hasMore ? $page + 1 : null,
        ]);
    }

}
