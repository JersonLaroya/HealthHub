<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminReportController extends Controller
{
    public function index()
    {
        // TOTAL CONSULTATIONS
        $totalConsultations = Consultation::count();

        // TOTAL PATIENTS (user + rcy)
        $totalPatients = User::whereHas('userRole', function ($q) {
            $q->whereIn('category', ['user', 'rcy']);
        })->count();

        // TOTAL FACULTY & STAFF
        $totalFacultyStaff = User::whereHas('userRole', function ($q) {
            $q->whereIn('name', ['Faculty', 'Staff']);
        })->count();

        // TOTAL STUDENTS (Student role OR rcy category)
        $totalStudents = User::whereHas('userRole', function ($q) {
            $q->where('name', 'Student')
              ->orWhere('category', 'rcy');
        })->count();

        $year = request('year') ?? now()->year;

        $monthly = Consultation::select(
                DB::raw("EXTRACT(MONTH FROM consultations.date) as month"),
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE 
                    WHEN ur.name = 'Student' OR ur.category = 'rcy' THEN 1 ELSE 0 END
                ) as students"),
                DB::raw("SUM(CASE 
                    WHEN ur.name IN ('Faculty','Staff') THEN 1 ELSE 0 END
                ) as faculty_staff")
            )
            ->join('users as u', 'consultations.user_id', '=', 'u.id')
            ->join('user_roles as ur', 'u.user_role_id', '=', 'ur.id')
            ->whereYear('consultations.date', $year)
            ->groupBy(DB::raw("EXTRACT(MONTH FROM consultations.date)"))
            ->orderBy(DB::raw("EXTRACT(MONTH FROM consultations.date)"))
            ->get();

        $months = collect(range(1,12))->map(function ($m) use ($monthly) {
            $row = $monthly->firstWhere('month', $m);

            return [
                'month' => $m,
                'students' => $row->students ?? 0,
                'faculty_staff' => $row->faculty_staff ?? 0,
                'total' => $row->total ?? 0,
            ];
        });

        return Inertia::render('admin/reports/index', [
            'stats' => [
                'totalPatients' => $totalPatients,
                'totalConsultations' => $totalConsultations,
                'totalFacultyStaff' => $totalFacultyStaff,
                'totalStudents' => $totalStudents,
            ],
            'months' => $months,
            'year' => $year,
        ]);
    }
}
