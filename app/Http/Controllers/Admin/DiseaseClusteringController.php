<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DiseaseClusteringService;
use Illuminate\Http\Request;

class DiseaseClusteringController extends Controller
{
    public function generate(Request $request, DiseaseClusteringService $service)
    {
        $year = $request->input('year', 'all'); // "all" or numeric string
        $year = ($year === 'all') ? 'all' : (int) $year;

        // Pass year to service (see service update below)
        $result = $service->cluster(3, $year);

        if (!$result['ok']) {
            return redirect()
                ->route('admin.reports.index', ['year' => $year === 'all' ? 'all' : $year])
                ->with('warning',
                    "Disease pattern analysis requires at least {$result['required']} approved consultations with diseases. " .
                    "Currently available: {$result['count']}."
                );
        }

        return redirect()
            ->route('admin.reports.index', ['year' => $year === 'all' ? 'all' : $year])
            ->with('success', 'Disease clusters generated successfully.');
    }
}