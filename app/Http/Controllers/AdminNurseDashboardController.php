<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Event;
use App\Models\Service;
use App\Models\Appointment;
use Carbon\CarbonPeriod;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminNurseDashboardController extends Controller
{
        public function index(Request $request)
    {
        $today = now()->toDateString();

        // Default = this month
        $defaultStart = now()->startOfMonth();
        $defaultEnd   = now()->endOfMonth();

        // Read query params
        $from = $request->query('from');
        $to   = $request->query('to');

        // Parse safely
        try {
            $rangeStart = $from ? \Carbon\Carbon::parse($from)->startOfDay() : $defaultStart->copy()->startOfDay();
        } catch (\Exception $e) {
            $rangeStart = $defaultStart->copy()->startOfDay();
        }

        try {
            $rangeEnd = $to ? \Carbon\Carbon::parse($to)->endOfDay() : $defaultEnd->copy()->endOfDay();
        } catch (\Exception $e) {
            $rangeEnd = $defaultEnd->copy()->endOfDay();
        }

        // Ensure start <= end
        if ($rangeStart->gt($rangeEnd)) {
            [$rangeStart, $rangeEnd] = [$rangeEnd->copy()->startOfDay(), $rangeStart->copy()->endOfDay()];
        }

        // Consultation service
        $consultationServiceId = Service::where('slug', 'clinic-consultation-record-form')->value('id');

        /* =========================
           SUMMARY CARDS
        ========================= */

        // OPTION A (recommended): make summary cards match selected range
        $totalConsultations = Record::where('records.status', Record::STATUS_APPROVED)
            ->where('records.service_id', $consultationServiceId)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->count();

        $pendingRecords = Record::pending()->count();

        $pendingBreakdown = Record::where('status', Record::STATUS_PENDING)
            ->with('service:id,title')
            ->get()
            ->groupBy('service.title')
            ->map(fn ($group) => $group->count())
            ->sortDesc();

        $patientsSeen = Record::where('records.status', Record::STATUS_APPROVED)
            ->where('records.service_id', $consultationServiceId)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->distinct('consultations.patient_id')
            ->count('consultations.patient_id');

        $todayConsultations = Record::where('records.status', Record::STATUS_APPROVED)
            ->where('records.service_id', $consultationServiceId)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereDate('consultations.date', $today)
            ->count();

        /* =========================
           STUDENT vs EMPLOYEE DAILY
        ========================= */

        $dates = CarbonPeriod::create($rangeStart->copy()->startOfDay(), $rangeEnd->copy()->startOfDay());

        $rawData = Record::where('records.status', Record::STATUS_APPROVED)
            ->where('records.service_id', $consultationServiceId)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->join('users', 'users.id', '=', 'consultations.patient_id')
            ->join('user_roles', 'user_roles.id', '=', 'users.user_role_id')
            ->whereBetween('consultations.date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->selectRaw("
                consultations.date as date,
                SUM(
                    CASE 
                        WHEN user_roles.name = 'Student'
                            OR user_roles.category = 'rcy'
                        THEN 1 ELSE 0
                    END
                ) as student_total,
                SUM(
                    CASE 
                        WHEN user_roles.name IN ('Faculty', 'Staff')
                        THEN 1 ELSE 0
                    END
                ) as employee_total
            ")
            ->groupBy('consultations.date')
            ->get()
            ->keyBy('date');

        $chartData = [];
        foreach ($dates as $date) {
            $formatted = $date->toDateString();
            $row = $rawData[$formatted] ?? null;

            $chartData[] = [
                'date' => $formatted,
                'student_total' => $row->student_total ?? 0,
                'employee_total' => $row->employee_total ?? 0,
            ];
        }

        /* =========================
           EVENTS + APPOINTMENTS (unchanged)
        ========================= */

        $now = now('Asia/Manila');

        $events = Event::query()
            ->where('end_at', '>=', $now)
            ->orderByRaw("
                CASE 
                    WHEN start_at <= ? AND end_at >= ? THEN 0
                    ELSE 1
                END
            ", [$now, $now])
            ->orderBy('start_at')
            ->limit(5)
            ->get();

        $upcomingAppointments = Appointment::with('user')
            ->where('appointment_date', '>=', now()->toDateString())
            ->where('status', 'approved')
            ->orderByRaw("
                CASE 
                    WHEN appointment_date = CURRENT_DATE THEN 0
                    ELSE 1
                END
            ")
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard/index', [
            'totalConsultations'   => $totalConsultations,
            'pendingRecords'       => $pendingRecords,
            'pendingBreakdown'     => $pendingBreakdown,
            'patientsSeen'         => $patientsSeen,
            'todayConsultations'   => $todayConsultations,
            'chartData'            => $chartData,
            'events'               => $events,
            'upcomingAppointments' => $upcomingAppointments,

            // Send filters back so React can keep the inputs filled after reload
            'filters' => [
                'from' => $rangeStart->toDateString(),
                'to'   => $rangeEnd->toDateString(),
            ],
        ]);
    }
}
