<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Event;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today      = now()->toDateString();
        $monthStart = now()->startOfMonth();
        $monthEnd   = now()->endOfMonth();

        /* =========================
           SUMMARY CARDS
        ========================= */

        // Total approved consultations this month
        $totalConsultations = Record::approved()
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$monthStart, $monthEnd])
            ->count();

        // Pending records (all time)
        $pendingRecords = Record::pending()->count();

        // Unique patients seen this month (approved only)
        $patientsSeen = Record::approved()
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereBetween('consultations.date', [$monthStart, $monthEnd])
            ->distinct('consultations.patient_id')
            ->count('consultations.patient_id');

        // Today’s approved consultations
        $todayConsultations = Record::approved()
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereDate('consultations.date', $today)
            ->count();

        /* =========================
           CHART DATA (LAST 30 DAYS)
        ========================= */

        $chartData = Record::approved()
            ->join('consultations', 'consultations.id', '=', 'records.consultation_id')
            ->whereDate('consultations.date', '>=', now()->subDays(30))
            ->selectRaw('consultations.date as date, COUNT(*) as total')
            ->groupBy('consultations.date')
            ->orderBy('consultations.date')
            ->get();

        /* =========================
           EVENTS (ONGOING + UPCOMING)
        ========================= */

        $events = Event::whereDate('end_date', '>=', $today)
            ->orderBy('start_date')
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
