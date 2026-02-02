<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Event;
use Carbon\CarbonPeriod;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class AdminNurseDashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth();
        $monthEnd   = now()->endOfMonth();

        /* =========================
           SUMMARY CARDS
        ========================= */

        // Total approved consultations this month
        $totalConsultations = Record::where('records.status', Record::STATUS_APPROVED)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$monthStart, $monthEnd])
            ->count();

        // Pending records (all time)
        $pendingRecords = Record::where('records.status', Record::STATUS_PENDING)->count();

        // Unique patients seen this month
        $patientsSeen = Record::where('records.status', Record::STATUS_APPROVED)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$monthStart, $monthEnd])
            ->distinct('consultations.patient_id')
            ->count('consultations.patient_id');

        // Today’s approved consultations
        $todayConsultations = Record::where('records.status', Record::STATUS_APPROVED)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereDate('consultations.date', $today)
            ->count();

        /* =========================
           CHART DATA (THIS MONTH – DAILY)
        ========================= */

        $dates = CarbonPeriod::create($monthStart, $monthEnd);

        $rawData = Record::where('records.status', Record::STATUS_APPROVED)
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$monthStart, $monthEnd])
            ->selectRaw('consultations.date as date, COUNT(*) as total')
            ->groupBy('consultations.date')
            ->pluck('total', 'date'); // key = date, value = total

        $chartData = [];

        foreach ($dates as $date) {
            $formatted = $date->toDateString();

            $chartData[] = [
                'date'  => $formatted,
                'total' => $rawData[$formatted] ?? 0,
            ];
        }

        /* =========================
           EVENTS (ONGOING + UPCOMING)
        ========================= */

        $events = Event::whereDate('end_at', '>=', $today)
            ->orderBy('start_at')
            ->get();

        return Inertia::render('dashboard/index', [
            'totalConsultations' => $totalConsultations,
            'pendingRecords'     => $pendingRecords,
            'patientsSeen'       => $patientsSeen,
            'todayConsultations' => $todayConsultations,
            'chartData'          => $chartData,
            'events'             => $events,
        ]);
    }
}
