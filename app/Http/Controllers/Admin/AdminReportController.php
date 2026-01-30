<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCluster;
use App\Models\User;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

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

        // Clustering
        $clusters = ConsultationCluster::with([
                'consultation.diseases',
                'consultation.user.userRole'
            ])->get()
            ->groupBy('cluster');

        $clusterReports = [];

        foreach ($clusters as $clusterNumber => $items) {

            $diseaseCount = [];
            $ageGroups = [];
            $roles = [];

            foreach ($items as $item) {

                $consultation = $item->consultation;
                $user = $consultation->user;

                // ----------------
                // AGE GROUP
                // ----------------
                if ($user && $user->birthdate && $consultation->date) {
                    $age = Carbon::parse($user->birthdate)
                        ->diffInYears(Carbon::parse($consultation->date));

                    $group = $this->getAgeGroupLabel($age);
                    $ageGroups[$group] = ($ageGroups[$group] ?? 0) + 1;
                }

                // ----------------
                // ROLE
                // ----------------
                $roleName = $this->normalizeRole($user?->userRole);
                $roles[$roleName] = ($roles[$roleName] ?? 0) + 1;

                // ----------------
                // DISEASES
                // ----------------
                foreach ($consultation->diseases as $disease) {
                    $diseaseCount[$disease->name] =
                        ($diseaseCount[$disease->name] ?? 0) + 1;
                }
            }

            arsort($diseaseCount);
            arsort($ageGroups);
            arsort($roles);

            $topRole = array_key_first($roles);
            $topAgeGroup = array_key_first($ageGroups);

            $topDiseaseNames = array_keys(array_slice($diseaseCount, 0, 2));

            $summary = 'Mostly ' . strtolower($topRole);

            if ($topAgeGroup) {
                $summary .= ' aged ' . $topAgeGroup;
            }

            if (count($topDiseaseNames) > 0) {
                $summary .= ' commonly reporting ' . implode(' and ', $topDiseaseNames);
            }

            $summary .= '.';

            $topDiseases = [];

            foreach (array_slice($diseaseCount, 0, 6) as $name => $count) {
                $topDiseases[] = [
                    'name' => $name,
                    'count' => $count,
                    'percentage' => round(($count / $items->count()) * 100, 1),
                ];
            }

            $clusterReports[] = [
                'cluster' => $clusterNumber + 1,
                'total' => $items->count(),
                'top_diseases' => $topDiseases,
                'top_age_group' => $topAgeGroup,
                'top_role' => $topRole,
                'summary' => ucfirst($summary),
            ];
        }

        $clusterChart = ConsultationCluster::select(
            'cluster',
            DB::raw('COUNT(*) as total')
        )
        ->groupBy('cluster')
        ->orderBy('cluster')
        ->get()
        ->map(function ($row) {
            return [
                'name' => 'Cluster ' . ($row->cluster + 1),
                'value' => $row->total,
            ];
        });

        $year = request('year') ?? now()->year;

        $monthlyPatternTrends = ConsultationCluster::select(
                DB::raw("EXTRACT(MONTH FROM consultations.date) as month"),
                'consultation_clusters.cluster',
                DB::raw("COUNT(*) as total")
            )
            ->join('consultations', 'consultation_clusters.consultation_id', '=', 'consultations.id')
            ->whereYear('consultations.date', $year)
            ->groupBy(
                DB::raw("EXTRACT(MONTH FROM consultations.date)"),
                'consultation_clusters.cluster'
            )
            ->orderBy(DB::raw("EXTRACT(MONTH FROM consultations.date)"))
            ->get();

        /*
        Format to:
        [
        { month: "Jan", "Pattern 1": 2, "Pattern 2": 1 },
        { month: "Feb", "Pattern 1": 0, "Pattern 2": 3 },
        ]
        */

        $patternTrendData = collect(range(1, 12))->map(function ($m) use ($monthlyPatternTrends) {

            $row = [
                'month' => date('M', mktime(0, 0, 0, $m, 1))
            ];

            foreach ($monthlyPatternTrends as $trend) {
                if ((int)$trend->month === $m) {
                    $row['Pattern ' . ($trend->cluster + 1)] = $trend->total;
                }
            }

            return $row;
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
            'clusters' => $clusterReports,
            'clusterChart' => $clusterChart,
            'patternTrends' => $patternTrendData,
        ]);
    }

    private function getAgeGroupLabel(int $age): string
    {
        if ($age <= 17) return 'Under 18 (Teenager)';
        if ($age <= 22) return '18–22 (Late teenager / young adult)';
        if ($age <= 30) return '23–30 (Young adult)';
        if ($age <= 45) return '31–45 (Adult)';
        return '46+ (Older adult)';
    }

    private function normalizeRole($userRole): string
    {
        if (!$userRole) return 'Unknown';

        // Treat Student and RCY as "Student"
        if ($userRole->name === 'Student' || $userRole->category === 'rcy') {
            return 'Student';
        }

        if ($userRole->name === 'Faculty') return 'Faculty';
        if ($userRole->name === 'Staff') return 'Staff';

        return $userRole->name;
    }

public function census()
{
    \Log::info('Census start');

    $years = Consultation::selectRaw('EXTRACT(YEAR FROM date) as year')
        ->distinct()
        ->orderBy('year', 'desc')
        ->pluck('year');

    $year  = request('year') ?? $years->first() ?? now()->year;
    $month = request('month');
    $group = request('group', 'student');

    $userIds = $this->getCensusUserIds($group);

    /*
    |--------------------------------------------------------------------------
    | WELL CENSUS — ALL INQUIRIES (ZERO INCLUDED)
    |--------------------------------------------------------------------------
    */
    $wellCensus = DB::table('list_of_inquiries as loi')
        ->leftJoin('inquiry_list_of_inquiry as ili', 'ili.list_of_inquiry_id', '=', 'loi.id')
        ->leftJoin('inquiries as i', function ($join) use ($year, $month, $userIds) {
            $join->on('ili.inquiry_id', '=', 'i.id')
                 ->whereIn('i.user_id', $userIds)
                 ->whereYear('i.created_at', $year);

            if ($month) {
                $join->whereMonth('i.created_at', $month);
            }
        })
        ->select(
            'loi.id',
            'loi.name as label',
            DB::raw('COUNT(i.id) as total')
        )
        ->groupBy('loi.id', 'loi.name')
        ->orderBy('loi.name')
        ->get();

    /*
    |--------------------------------------------------------------------------
    | SICK CENSUS — ALL DISEASES (ZERO INCLUDED)
    |--------------------------------------------------------------------------
    */
    $sickCensus = DB::table('list_of_diseases as d')
        ->leftJoin('consultation_disease as cd', 'cd.disease_id', '=', 'd.id')
        ->leftJoin('consultations as c', function ($join) use ($year, $month, $userIds) {
            $join->on('cd.consultation_id', '=', 'c.id')
                 ->whereIn('c.user_id', $userIds)
                 ->whereYear('c.date', $year);

            if ($month) {
                $join->whereMonth('c.date', $month);
            }
        })
        ->select(
            'd.id',
            'd.name as label',
            DB::raw('COUNT(c.id) as total')
        )
        ->groupBy('d.id', 'd.name')
        ->orderBy('d.name')
        ->get();

    /*
    |--------------------------------------------------------------------------
    | TREATMENT CENSUS — ALL TREATMENTS (ZERO INCLUDED)
    |--------------------------------------------------------------------------
    */
    $treatmentCensus = DB::table('list_of_treatments as t')
        ->leftJoin('consultation_treatment as ct', 'ct.treatment_id', '=', 't.id')
        ->leftJoin('consultations as c', function ($join) use ($year, $month, $userIds) {
            $join->on('ct.consultation_id', '=', 'c.id')
                 ->whereIn('c.user_id', $userIds)
                 ->whereYear('c.date', $year);

            if ($month) {
                $join->whereMonth('c.date', $month);
            }
        })
        ->select(
            't.id',
            't.name as label',
            DB::raw('COUNT(c.id) as total')
        )
        ->groupBy('t.id', 't.name')
        ->orderBy('t.name')
        ->get();

    \Log::info('Census end');

    return Inertia::render('admin/reports/census', [
        'year' => $year,
        'years' => $years,
        'month' => $month,
        'group' => $group,
        'wellCensus' => $wellCensus,
        'sickCensus' => $sickCensus,
        'treatmentCensus' => $treatmentCensus,
    ]);
}



    // ⬇⬇⬇ ADD THIS HELPER BELOW ⬇⬇⬇
    private function getCensusUserIds(string $group)
    {
        return User::whereHas('userRole', function ($q) use ($group) {

            if ($group === 'employee') {
                $q->whereIn('name', ['Faculty', 'Staff']);
            }

            if ($group === 'student') {
                $q->where('name', 'Student')
                  ->orWhere('category', 'rcy');
            }

        })->pluck('id');
    }

}
