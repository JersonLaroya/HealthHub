<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DiseaseClusteringService;
use Illuminate\Http\Request;

class DiseaseClusteringController extends Controller
{
    public function generate(DiseaseClusteringService $service)
    {
        $service->cluster(3); // you can change k later

        return back()->with('success', 'Disease clusters generated successfully.');
    }
}
