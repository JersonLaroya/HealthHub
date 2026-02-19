<?php

namespace App\Http\Controllers;

use App\Events\InquiryApproved;
use App\Events\RcyInquiryCreated;
use App\Events\UserInquiryCreated;
use App\Models\Inquiry;
use App\Models\ListOfInquiry;
use App\Models\User;
use App\Notifications\InquiryApprovedNotification;
use Illuminate\Http\Request;
use App\Notifications\RcyInquirySubmitted;
use Illuminate\Validation\Rule;

class InquiryController extends Controller
{
    /**
     * List inquiries for a patient
     */
    public function index(Request $request, User $patient)
    {
        $patient->load([
            'course:id,code',
            'yearLevel:id,level',
            'office:id,name,code',
        ]);

        $inquiries = Inquiry::with([
            'inquiryTypes',
            'creator:id,first_name,last_name',
            'updater:id,first_name,last_name',
        ])
        ->where('user_id', $patient->id)
        ->latest()
        ->paginate(10)
        ->withQueryString();

        $inquiryTypes = ListOfInquiry::orderBy('name')->get();

        return inertia('patients/inquiries/Index', [
            'patient' => $patient,
            'inquiries' => $inquiries, // ✅ now paginator object
            'inquiryTypes' => $inquiryTypes,
            'breadcrumbs' => [
                ['title' => 'Patients', 'href' => '/admin/patients'], // optional
                ['title' => 'Inquiries', 'href' => $request->url()],
            ],
        ]);
    }

    /**
     * Store a new inquiry
     */
    public function store(Request $request, User $patient)
    {
        $data = $request->validate([
            'inquiry_type_ids' => 'required|array|min:1',
            'inquiry_type_ids.*' => 'exists:list_of_inquiries,id',
            'description' => 'required|string',
            'response' => 'nullable|string', // ✅ allow response
        ]);

        $authUser = auth()->user();

        // Admin / Nurse inquiries are always approved
        $inquiry = Inquiry::create([
            'user_id' => $patient->id,
            'created_by' => $authUser->id,
            'updated_by' => $authUser->id,          // ✅ who responded
            'description' => $data['description'],
            'status' => 'approved',
            'response' => $data['response'] ?? null, // ✅ store response
            'responded_at' => !empty($data['response']) ? now() : null, // ✅ timestamp if response exists
        ]);

        $inquiry->inquiryTypes()->sync($data['inquiry_type_ids']);

        return back()->with('success', 'Inquiry added successfully.');
    }

    public function approve(Request $request, Inquiry $inquiry)
    {
        abort_unless(
            in_array(auth()->user()->userRole?->name, ['Admin', 'Nurse']),
            403
        );

        $data = $request->validate([
            'response' => ['required', 'string'],
        ]);

        $inquiry->refresh();

        if ($inquiry->status === 'approved') {
            return back()->with('info', 'Inquiry already approved.');
        }

        $inquiry->update([
            'status' => 'approved',
            'updated_by' => auth()->id(),
            'response' => $data['response'],
            'responded_at' => now(),
        ]);

        // Broadcast event for UI refresh
        event(new InquiryApproved($inquiry->user_id, $inquiry->id));

        /**
         * ✅ Notify ONLY if patient created it themselves
         * created_by == user_id means user submitted own inquiry
         */
        if ((int)$inquiry->created_by === (int)$inquiry->user_id) {
            $patient = User::find($inquiry->user_id);

            if ($patient) {
                $patient->notify(new InquiryApprovedNotification(
                    title: 'Your inquiry has been approved',
                    message: "Response: {$inquiry->response}",
                    url: "/user/inquiries", // user’s page
                    slug: 'inquiry-approved',
                    inquiryId: $inquiry->id
                ));
            }
        }

        /**
         * Mark related pending notifications read for Admin/Nurse
         * (include both rcy-inquiry + user-inquiry)
         */
        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(function ($user) use ($inquiry) {
                $user->unreadNotifications()
                    ->whereRaw("data->>'slug' IN ('rcy-inquiry','user-inquiry')")
                    ->whereRaw("data->>'inquiry_id' = ?", [(string)$inquiry->id])
                    ->update(['read_at' => now()]);
            });

        return back()->with('success', 'Inquiry approved.');
    }



    /**
     * Update an inquiry
     */
    public function update(Request $request, Inquiry $inquiry)
    {
        $data = $request->validate([
            'inquiry_type_ids' => 'required|array|min:1',
            'inquiry_type_ids.*' => 'exists:list_of_inquiries,id',
            'description' => 'required|string',
        ]);

        $inquiry->update([
            'description' => $data['description'] ?? null,
            'updated_by' => auth()->id(),
        ]);

        $inquiry->inquiryTypes()->sync($data['inquiry_type_ids']);

        return back()->with('success', 'Inquiry updated successfully.');
    }

    public function destroy(Inquiry $inquiry)
    {
        abort_unless(
            auth()->user()->userRole?->name === 'Admin',
            403
        );

        $inquiry->delete();

        return back()->with('success', 'Inquiry deleted.');
    }

    public function userIndex()
    {
        $user = auth()->user();

        $inquiries = Inquiry::with(['inquiryTypes'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function ($inq) {
                return [
                    'id' => $inq->id,
                    'status' => $inq->status,
                    'description' => $inq->description,
                    'created_at' => $inq->created_at,
                    'response' => $inq->response,          // ✅ add
                    'responded_at' => $inq->responded_at,  // ✅ optional
                    'inquiry_types' => $inq->inquiryTypes->map(fn($t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                    ]),
                ];
            });

        $inquiryTypes = ListOfInquiry::orderBy('name')->get();

        return inertia('user/inquiries/Index', [
            'inquiries' => $inquiries,
            'inquiryTypes' => $inquiryTypes,
            'breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => '/user/dashboard'],
                ['title' => 'My Inquiries', 'href' => '/user/inquiries'],
            ],
        ]);
    }

    public function userStore(Request $request)
    {
        $data = $request->validate([
            'inquiry_type_ids' => 'required|array|min:1',
            'inquiry_type_ids.*' => 'exists:list_of_inquiries,id',
            'description' => 'required|string',
        ]);

        $authUser = auth()->user();

        $inquiry = Inquiry::create([
            'user_id' => $authUser->id,
            'created_by' => $authUser->id,
            'description' => $data['description'] ?? null,
            'status' => 'pending', // ✅ user requests are pending
        ]);

        $inquiry->inquiryTypes()->sync($data['inquiry_type_ids']);

        // after $inquiry->inquiryTypes()->sync(...)
        $patientName = trim($authUser->first_name . ' ' . $authUser->last_name);

        $staff = User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->get();

        event(new UserInquiryCreated($authUser->id, $inquiry->id));

        foreach ($staff as $user) {
            $prefix = strtolower(str_replace(' ', '', $user->userRole->name)); // admin / nurse

            $user->notify(new RcyInquirySubmitted(
                title: 'Inquiry Pending Approval',
                message: "{$patientName} submitted an inquiry. Please review and approve.",
                url: "/{$prefix}/patients/{$authUser->id}/inquiries",
                slug: 'user-inquiry', // distinguish from rcy-inquiry
                inquiryId: $inquiry->id
            ));
        }

        return back()->with('success', 'Inquiry submitted and pending approval.');
    }


}
