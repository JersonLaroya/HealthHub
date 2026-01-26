<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCluster;
use App\Models\ListOfDisease;
use Illuminate\Support\Facades\DB;

class DiseaseClusterAnalyticsController extends Controller
{
    public function index()
    {
        // get clusters with consultations & diseases
        $clusters = ConsultationCluster::with('consultation.diseases')->get()
            ->groupBy('cluster');

        $analytics = [];

        foreach ($clusters as $clusterNumber => $items) {

            $diseaseCount = [];

            foreach ($items as $item) {
                foreach ($item->consultation->diseases as $disease) {
                    $diseaseCount[$disease->name] = ($diseaseCount[$disease->name] ?? 0) + 1;
                }
            }

            arsort($diseaseCount);

            $analytics[] = [
                'cluster' => $clusterNumber,
                'total_consultations' => $items->count(),
                'top_diseases' => array_slice($diseaseCount, 0, 8),
            ];
        }

        return inertia('admin/analytics/DiseaseClusters', [
            'clusters' => $analytics
        ]);
    }
}
