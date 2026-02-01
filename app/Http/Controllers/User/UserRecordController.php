<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\Consultation;
use App\Models\Setting;
use App\Models\Record;

class UserRecordController extends Controller
{
    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        // =========================
        // Patient info
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
        // ONLY APPROVED CONSULTATIONS
        // =========================
        $consultations = Consultation::where('patient_id', $user->id)
            ->whereHas('record', function ($q) {
                $q->where('status', Record::STATUS_APPROVED);
            })
            ->with([
                'vitalSigns',
                'record',
            ])
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->paginate(10)
            ->withQueryString();

        // =========================
        // School year
        // =========================
        $setting = Setting::first();

        return Inertia::render('user/records', [
            'patient' => $patient,
            'consultations' => $consultations,
            'schoolYear' => $setting?->school_year,
        ]);
    }
}
