<?php

namespace App\Http\Controllers;

use App\Events\InquiryApproved;
use App\Events\RcyInquiryCreated;
use App\Models\Inquiry;
use App\Models\ListOfInquiry;
use App\Models\User;
use Illuminate\Http\Request;
use App\Notifications\RcyInquirySubmitted;

class InquiryController extends Controller
{
    /**
     * List inquiries for a patient
     */
    public function index(User $patient)
    {
        $inquiries = Inquiry::with([
                'inquiryTypes',
                'creator:id,first_name,last_name',
                'updater:id,first_name,last_name',
            ])
            ->where('user_id', $patient->id)
            ->latest()
            ->get();

        $inquiryTypes = ListOfInquiry::orderBy('name')->get();

        return inertia('patients/inquiries/Index', [
            'patient' => $patient,
            'inquiries' => $inquiries,
            'inquiryTypes' => $inquiryTypes,
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
            'description' => 'nullable|string',
        ]);

        $authUser = auth()->user();

        // Admin / Nurse inquiries are always approved
        $inquiry = Inquiry::create([
            'user_id' => $patient->id,
            'created_by' => $authUser->id,
            'description' => $data['description'] ?? null,
            'status' => 'approved',
        ]);

        $inquiry->inquiryTypes()->sync($data['inquiry_type_ids']);

        return back()->with('success', 'Inquiry added successfully.');
    }

    public function approve(Inquiry $inquiry)
    {
        abort_unless(
            in_array(auth()->user()->userRole?->name, ['Admin', 'Nurse']),
            403
        );

        // Prevent double approval
        if ($inquiry->status === 'approved') {
            return back()->with('info', 'Inquiry already approved.');
        }

        $inquiry->update([
            'status' => 'approved',
            'updated_by' => auth()->id(),
        ]);

        event(new InquiryApproved($inquiry->user_id, $inquiry->id));

        /* =====================================================
        MARK RELATED RCY INQUIRY NOTIFICATIONS AS READ
        (Admin + Nurse)
        ====================================================== */
        User::whereHas('userRole', function ($q) {
            $q->whereIn('name', ['Admin', 'Nurse']);
        })->each(function ($user) use ($inquiry) {

            $user->unreadNotifications()
                ->whereRaw("data->>'slug' = ?", ['rcy-inquiry'])
                ->whereRaw("data->>'inquiry_id' = ?", [(string) $inquiry->id])
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
            'description' => 'nullable|string',
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

}
