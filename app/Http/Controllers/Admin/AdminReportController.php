<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCluster;
use App\Models\DiseaseCategory;
use App\Models\User;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;


class AdminReportController extends Controller
{
    public function index()
    {

        // Clustering
        $year = request('year', now()->year); // can be "all" or a year number
        $isAllYears = ($year === 'all');

        $clustersQuery = ConsultationCluster::query()
            ->join('consultations', 'consultation_clusters.consultation_id', '=', 'consultations.id')
            ->with([
                'consultation.diseases',
                'consultation.patient.userRole',
            ])
            ->select('consultation_clusters.*');

        if (!$isAllYears) {
            $clustersQuery->whereYear('consultations.date', (int) $year);
        }

        $clusters = $clustersQuery->get()->groupBy('cluster');

        $clusterReports = [];

        foreach ($clusters as $clusterNumber => $items) {

            $patients = [];

            $diseaseCount = [];
            $ageGroups = [];
            $roles = [];

            foreach ($items as $item) {

                $consultation = $item->consultation;

                if (!$consultation) {
                    continue;
                }

                // ✅ Count diseases FIRST (independent of patient)
                foreach ($consultation->diseases as $disease) {
                    $diseaseCount[$disease->name] =
                        ($diseaseCount[$disease->name] ?? 0) + 1;
                }

                $patient = $consultation->patient;

                if (!$patient) {
                    continue; // skip age & role only
                }

                // ✅ Collect patients
                $patients[] = [
                    'id' => $patient->id,
                    'name' => trim($patient->first_name . ' ' . $patient->last_name),
                ];

                // AGE GROUP
                if ($patient->birthdate && $consultation->date) {
                    $age = Carbon::parse($patient->birthdate)
                        ->diffInYears(Carbon::parse($consultation->date));

                    $group = $this->getAgeGroupLabel($age);
                    $ageGroups[$group] = ($ageGroups[$group] ?? 0) + 1;
                }

                // ROLE
                $roleName = $this->normalizeRole($patient->userRole ?? null);
                $roles[$roleName] = ($roles[$roleName] ?? 0) + 1;
            }

            // IMPORTANT: unique AFTER consultation loop
            $uniquePatients = collect($patients)->unique('id')->values();

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
                'patients' => $uniquePatients,
            ];
        }

        $clusterChartQuery = ConsultationCluster::select(
                'consultation_clusters.cluster',
                DB::raw('COUNT(*) as total')
            )
            ->join('consultations', 'consultation_clusters.consultation_id', '=', 'consultations.id');

        if (!$isAllYears) {
            $clusterChartQuery->whereYear('consultations.date', (int) $year);
        }

        $clusterChart = $clusterChartQuery
            ->groupBy('consultation_clusters.cluster')
            ->orderBy('consultation_clusters.cluster')
            ->get()
            ->map(function ($row) {
                return [
                    'name' => 'Cluster ' . ($row->cluster + 1),
                    'value' => $row->total,
                ];
            });

        /*
        Format to:
        [
        { month: "Jan", "Pattern 1": 2, "Pattern 2": 1 },
        { month: "Feb", "Pattern 1": 0, "Pattern 2": 3 },
        ]
        */

        $patternTrendData = [];

        if (!$isAllYears) {
            $monthlyPatternTrends = ConsultationCluster::select(
                    DB::raw("EXTRACT(MONTH FROM consultations.date) as month"),
                    'consultation_clusters.cluster',
                    DB::raw("COUNT(*) as total")
                )
                ->join('consultations', 'consultation_clusters.consultation_id', '=', 'consultations.id')
                ->whereYear('consultations.date', (int) $year)
                ->groupBy(
                    DB::raw("EXTRACT(MONTH FROM consultations.date)"),
                    'consultation_clusters.cluster'
                )
                ->orderBy(DB::raw("EXTRACT(MONTH FROM consultations.date)"))
                ->get();

        $patternTrendData = collect(range(1, 12))->map(function ($m) use ($monthlyPatternTrends) {
                $row = [
                    'month' => date('M', mktime(0, 0, 0, $m, 1))
                ];

                foreach ($monthlyPatternTrends as $trend) {
                    if ((int) $trend->month === $m) {
                        $row['Pattern ' . ($trend->cluster + 1)] = $trend->total;
                    }
                }

                return $row;
            });
        }

        return Inertia::render('admin/reports/index', [
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

    $from = request('from')
        ? Carbon::parse(request('from'))->startOfDay()
        : now()->startOfMonth();

    $to = request('to')
        ? Carbon::parse(request('to'))->endOfDay()
        : now()->endOfMonth();

    $group = request('group', 'all');

    $userIds = $this->getCensusUserIds($group);

    /*
    |--------------------------------------------------------------------------
    | WELL CENSUS — ALL INQUIRIES (ZERO INCLUDED)
    |--------------------------------------------------------------------------
    */
    $wellCensus = DB::table('list_of_inquiries as loi')
        ->leftJoin('inquiry_list_of_inquiry as ili', 'ili.list_of_inquiry_id', '=', 'loi.id')
        ->leftJoin('inquiries as i', function ($join) use ($from, $to, $userIds) {
            $join->on('ili.inquiry_id', '=', 'i.id')
                 ->whereIn('i.user_id', $userIds)
                 ->whereBetween('i.created_at', [$from, $to]);
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
        ->leftJoin('consultations as c', function ($join) use ($from, $to, $userIds) {
            $join->on('cd.consultation_id', '=', 'c.id')
                ->whereIn('c.patient_id', $userIds)
                ->whereBetween('c.date', [$from, $to]);
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
        ->leftJoin('consultations as c', function ($join) use ($from, $to, $userIds) {
            $join->on('ct.consultation_id', '=', 'c.id')
                ->whereIn('c.patient_id', $userIds)
                ->whereBetween('c.date', [$from, $to]);
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
        'from' => $from->toDateString(),
        'to' => $to->toDateString(),
        'group' => $group,
        'wellCensus' => $wellCensus,
        'sickCensus' => $sickCensus,
        'treatmentCensus' => $treatmentCensus,
    ]);
}

    private function getCensusUserIds(string $group)
    {
        // ALL = no role filtering
        if ($group === 'all') {
            return User::pluck('id');
        }

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

public function downloadCensusTemplate()
{
    ini_set('display_errors', 0);
    error_reporting(0);

    $from = request('from')
        ? Carbon::parse(request('from'))->startOfMonth()
        : now()->startOfMonth();

    $to = request('to')
        ? Carbon::parse(request('to'))->endOfMonth()
        : now()->endOfMonth();

    $group   = request('group', 'all');
    $userIds = $this->getCensusUserIds($group);

    $groupLabel = match ($group) {
        'student'  => 'STUDENTS',
        'employee' => 'EMPLOYEES',
        default    => 'ALL PATIENTS',
    };

    // Spreadsheet
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Census Report');

    $sheet->getColumnDimension('A')->setWidth(45);
    $sheet->getColumnDimension('B')->setWidth(15);

    $row = 1;

    /* =====================================================
       HEADER (like your file)
    ===================================================== */
    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", "MONTH: " . strtoupper($from->format('F')) . " ");
    $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
    $row++;

    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", $groupLabel);
    $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
    $row++;

    /* =====================================================
       WELL CENSUS
    ===================================================== */
    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", "WELL CENSUS");
    $sheet->getStyle("A{$row}")->getFont()->setBold(true);
    $row++;

    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", "CHIEF COMPLAINT");
    $sheet->getStyle("A{$row}")->getFont()->setBold(true);
    $row++;

    $wellStartRow = $row;

    $well = DB::table('list_of_inquiries as loi')
        ->leftJoin('inquiry_list_of_inquiry as ili', 'ili.list_of_inquiry_id', '=', 'loi.id')
        ->leftJoin('inquiries as i', function ($join) use ($from, $to, $userIds) {
            $join->on('ili.inquiry_id', '=', 'i.id')
                ->whereIn('i.user_id', $userIds)
                ->whereBetween('i.created_at', [$from, $to]);
        })
        ->select('loi.name', DB::raw('COUNT(i.id) as total'))
        ->groupBy('loi.name')
        ->orderBy('loi.name')
        ->get();

    foreach ($well as $w) {
        $sheet->setCellValue("A{$row}", $w->name);
        $sheet->setCellValue("B{$row}", (int) $w->total); // ✅ counts in col B
        $row++;
    }

    $wellEndRow = $row - 1;

    $sheet->setCellValue("A{$row}", "TOTAL WELL CENSUS");
    $sheet->setCellValue("B{$row}", "=SUM(B{$wellStartRow}:B{$wellEndRow})");
    $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
    $row += 2;

    $wellChart = storage_path('app/charts/well.png');

    if (file_exists($wellChart)) {
        $img = new Drawing();
        $img->setName('Well Census Chart');
        $img->setPath($wellChart);
        $img->setHeight(480);
        $img->setCoordinates('D2');
        $img->setWorksheet($sheet);
    }

    /* =====================================================
       SICK CENSUS
    ===================================================== */
    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", "SICK CENSUS");
    $sheet->getStyle("A{$row}")->getFont()->setBold(true);
    $row++;

    $sickStartRow = $row; // will be used for SUM (numeric cells only)

    $categories = DiseaseCategory::with('diseases')
        ->orderBy('name')
        ->get();

    foreach ($categories as $category) {

        // Category header (bold, no count)
        $sheet->setCellValue("A{$row}", strtoupper($category->name));
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        foreach ($category->diseases as $disease) {

            $count = DB::table('consultation_disease as cd')
                ->join('consultations as c', 'cd.consultation_id', '=', 'c.id')
                ->where('cd.disease_id', $disease->id)
                ->whereIn('c.patient_id', $userIds)
                ->whereBetween('c.date', [$from, $to])
                ->count();

            // ✅ include zeros (your file includes 0 rows)
            $sheet->setCellValue("A{$row}", $disease->name);
            $sheet->setCellValue("B{$row}", (int) $count);
            $row++;
        }
    }

    $sickEndRow = $row - 1;

    $sheet->setCellValue("A{$row}", "TOTAL SICK CENSUS");
    $sheet->setCellValue("B{$row}", "=SUM(B{$sickStartRow}:B{$sickEndRow})");
    $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
    $row += 2;

    $sickChart = storage_path('app/charts/sick.png');

    if (file_exists($sickChart)) {
        $img = new Drawing();
        $img->setName('Sick Census Chart');
        $img->setPath($sickChart);
        $img->setHeight(height: 480);
        $img->setCoordinates('D35');
        $img->setWorksheet($sheet);
    }

    /* =====================================================
       TREATMENT CENSUS
    ===================================================== */
    $sheet->mergeCells("A{$row}:B{$row}");
    $sheet->setCellValue("A{$row}", "TREATMENT CENSUS");
    $sheet->getStyle("A{$row}")->getFont()->setBold(true);
    $row++;

    $treatStartRow = $row;

    $treatments = DB::table('list_of_treatments as t')
        ->leftJoin('consultation_treatment as ct', 'ct.treatment_id', '=', 't.id')
        ->leftJoin('consultations as c', function ($join) use ($from, $to, $userIds) {
            $join->on('ct.consultation_id', '=', 'c.id')
                ->whereIn('c.patient_id', $userIds)
                ->whereBetween('c.date', [$from, $to]);
        })
        ->select('t.name', DB::raw('COUNT(c.id) as total'))
        ->groupBy('t.name')
        ->orderBy('t.name')
        ->get();

    foreach ($treatments as $t) {
        $sheet->setCellValue("A{$row}", $t->name);
        $sheet->setCellValue("B{$row}", (int) $t->total); // ✅ counts in col B
        $row++;
    }

    $treatEndRow = $row - 1;

    $sheet->setCellValue("A{$row}", "TOTAL TREATMENT CENSUS");
    $sheet->setCellValue("B{$row}", "=SUM(B{$treatStartRow}:B{$treatEndRow})");
    $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
    $row += 1;

    $treatmentChart = storage_path('app/charts/treatment.png');

    if (file_exists($treatmentChart)) {
        $img = new Drawing();
        $img->setName('Treatment Census Chart');
        $img->setPath($treatmentChart);
        $img->setHeight(480);
        $img->setCoordinates('D70');
        $img->setWorksheet($sheet);
    }

    /* =====================================================
       TOTAL CASES + TOTAL SEEN (like your file)
       - TOTAL CASES: number of consultations in the range
       - TOTAL SEEN: Well + Sick + Treatment totals
    ===================================================== */
    $totalCases = DB::table('consultations as c')
        ->whereIn('c.patient_id', $userIds)
        ->whereBetween('c.date', [$from, $to])
        ->count();

    $row += 1;
    $sheet->setCellValue("A{$row}", "TOTAL CASES");
    $sheet->setCellValue("B{$row}", (int) $totalCases);
    $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
    $row++;

    $seenLabel = match ($group) {
        'student'  => 'TOTAL NO. OF STUDENTS SEEN',
        'employee' => 'TOTAL NO. OF EMPLOYEES SEEN',
        default    => 'TOTAL NO. OF PATIENTS SEEN',
    };

    // This matches your template: total seen = sum of the 3 totals
    // We’ll reference the formula cells we created:
    // - Total well cell row = ($wellTotalRow)
    // - Total sick cell row = ($sickTotalRow)
    // - Total treatment cell row = ($treatTotalRow)
    // We'll track them now:
    // NOTE: We know where they are because we just wrote them.
    // But easiest is compute directly too:
    $totalWell = DB::table('list_of_inquiries as loi')
        ->leftJoin('inquiry_list_of_inquiry as ili', 'ili.list_of_inquiry_id', '=', 'loi.id')
        ->leftJoin('inquiries as i', function ($join) use ($from, $to, $userIds) {
            $join->on('ili.inquiry_id', '=', 'i.id')
                ->whereIn('i.user_id', $userIds)
                ->whereBetween('i.created_at', [$from, $to]);
        })
        ->count('i.id');

    $totalSick = DB::table('consultation_disease as cd')
        ->join('consultations as c', 'cd.consultation_id', '=', 'c.id')
        ->whereIn('c.patient_id', $userIds)
        ->whereBetween('c.date', [$from, $to])
        ->count();

    $totalTreatment = DB::table('consultation_treatment as ct')
        ->join('consultations as c', 'ct.consultation_id', '=', 'c.id')
        ->whereIn('c.patient_id', $userIds)
        ->whereBetween('c.date', [$from, $to])
        ->count();

    $sheet->setCellValue("A{$row}", $seenLabel);
    $sheet->setCellValue("B{$row}", (int) ($totalWell + $totalSick + $totalTreatment));
    $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);

    /* =====================================================
       DOWNLOAD
    ===================================================== */
    while (ob_get_level()) {
        ob_end_clean();
    }

    $filename = "CENSUS_CANDIJAY_" . strtoupper($from->format('M_Y')) . ".xlsx";

    return response()->streamDownload(function () use ($spreadsheet) {
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
    }, $filename, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);
}

}
