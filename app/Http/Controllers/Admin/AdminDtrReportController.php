<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminDtrReportController extends Controller
{
public function index(Request $request)
{
    $year  = $request->year ?? now()->year;
    $month = $request->month;

    $years = Consultation::selectRaw('EXTRACT(YEAR FROM date) as year')
        ->distinct()
        ->orderBy('year', 'desc')
        ->pluck('year');

    $consultations = Consultation::with([
            'user.course',
            'user.yearLevel',
            'user.office',
            'vitalSigns'
        ])
        ->whereYear('date', $year)
        ->when($month, fn($q) => $q->whereMonth('date', $month))
        ->orderBy('date')
        ->orderBy('time')
        ->get();
    
    /* FORMAT TIME HERE */
    $consultations->transform(function ($c) {
        if ($c->time) {
            $c->formatted_time = Carbon::createFromFormat('H:i:s', $c->time)
                ->format('h:i A'); // 10:34 AM
        } else {
            $c->formatted_time = null;
        }

        return $c;
    });

    return Inertia::render('admin/reports/dtr', [
        'consultations' => $consultations,
        'filters' => compact('year', 'month'),
        'years' => $years,
    ]);
}


public function export(Request $request)
{
    $year  = $request->year ?? now()->year;
    $month = $request->month;
    $years = Consultation::selectRaw('EXTRACT(YEAR FROM date) as year')
    ->distinct()
    ->orderBy('year', 'desc')
    ->pluck('year');

    $consultations = Consultation::with([
            'user.course',
            'user.yearLevel',
            'user.office',
            'vitalSigns'
        ])
        ->whereYear('date', $year)
        ->when($month, fn($q) => $q->whereMonth('date', $month))
        ->orderBy('date')
        ->orderBy('time')
        ->get();
    
    /* FORMAT TIME HERE */
    $consultations->transform(function ($c) {
        if ($c->time) {
            $c->formatted_time = Carbon::createFromFormat('H:i:s', $c->time)
                ->format('h:i A');
        } else {
            $c->formatted_time = null;
        }

        return $c;
    });

    return Inertia::render('admin/reports/dtr-export', [
        'consultations' => $consultations,
        'filters' => compact('year', 'month'),
        'years' => $years,
    ]);
}

}
