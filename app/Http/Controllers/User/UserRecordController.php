<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\Consultation;
use App\Models\Setting;

class UserRecordController extends Controller
{
    /**
     * Display the logged-in user's consultation records.
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        // =========================
        // Patient info (same as admin show page)
        // =========================
        $patient = User::with([
            'vitalSign' => function ($q) {
                $q->whereNotNull('blood_type')
                ->orderBy('created_at', 'asc')
                ->limit(1);
            },
            'homeAddress.barangay.municipality.province',
            'presentAddress.barangay.municipality.province',
            'course',
            'yearLevel',
            'office',
            'userRole',
        ])->findOrFail($user->id);

        // =========================
        // Consultations (VIEW ONLY)
        // =========================
        $consultations = Consultation::where('user_id', $user->id)
            ->with([
                'vitalSigns',
                'diseases',
                'creator',
                'updater',
            ])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->paginate(10)
            ->withQueryString();

        // =========================
        // School year (from settings)
        // =========================
        $setting = Setting::first();

        return Inertia::render('user/records', [
            'patient' => $patient,
            'consultations' => $consultations,
            'schoolYear' => $setting?->school_year,
        ]);
    }
}
