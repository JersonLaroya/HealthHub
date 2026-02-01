<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DiseaseClusteringService;
use Illuminate\Http\Request;

class DiseaseClusteringController extends Controller
{
    public function generate(DiseaseClusteringService $service)
    {
        $result = $service->cluster(3);

        if (!$result['ok']) {
            return back()->with('warning',
                "Disease pattern analysis requires at least {$result['required']} approved consultations with diseases. ".
                "Currently available: {$result['count']}."
            );
        }

        return back()->with('success', 'Disease clusters generated successfully.');
    }
}
