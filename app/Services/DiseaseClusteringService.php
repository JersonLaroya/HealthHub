<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Disease;
use App\Models\ConsultationCluster;
use Carbon\Carbon;
use Phpml\Clustering\KMeans;

class DiseaseClusteringService
{
    /**
     * @param int $k
     * @param int|string $year  "all" or 2026, 2025, etc.
     */
    public function cluster(int $k = 3, $year = 'all')
    {
        $diseases = Disease::orderBy('id')->get();

        $consultationsQuery = Consultation::whereHas('diseases')
            ->whereHas('record', fn ($q) => $q->where('status', 'approved'))
            ->with(['diseases', 'patient.userRole']);

        // ✅ Apply year filter only when not "all"
        if ($year !== 'all') {
            $consultationsQuery->whereYear('date', (int) $year);
        }

        $consultations = $consultationsQuery->get();

        $samples = [];
        $consultationMap = [];

        foreach ($consultations as $consultation) {

            $patient = $consultation->patient;

            // ✅ add birthdate check to avoid Carbon parse error
            if (!$patient || !$patient->birthdate || !$consultation->date) {
                continue;
            }

            if ($consultation->diseases->isEmpty()) {
                continue;
            }

            // -------------------
            // PEOPLE FEATURES
            // -------------------

            $age = Carbon::parse($patient->birthdate)
                ->diffInYears(Carbon::parse($consultation->date));

            $ageGroup = $this->getAgeGroup($age);

            $roleName = $patient->userRole->name ?? null;
            $category = $patient->userRole->category ?? null;

            $roleCode = $this->getRoleCode($roleName, $category);

            $vector = [
                $ageGroup,
                $roleCode,
            ];

            // -------------------
            // DISEASE FEATURES
            // -------------------

            foreach ($diseases as $disease) {
                $vector[] = $consultation->diseases->contains($disease->id) ? 1 : 0;
            }

            $samples[] = $vector;
            $consultationMap[] = $consultation->id;
        }

        if (count($samples) < $k) {
            return [
                'ok' => false,
                'reason' => 'NOT_ENOUGH_DATA',
                'count' => count($samples),
                'required' => $k,
            ];
        }

        $kmeans = new KMeans($k);
        $clusters = $kmeans->cluster($samples);

        ConsultationCluster::truncate(); // note: clears all years too

        $usedIndexes = [];

        foreach ($clusters as $clusterIndex => $clusterSamples) {
            foreach ($clusterSamples as $sample) {
                foreach ($samples as $i => $original) {
                    if (!in_array($i, $usedIndexes, true) && $original === $sample) {

                        $usedIndexes[] = $i;

                        ConsultationCluster::create([
                            'consultation_id' => $consultationMap[$i],
                            'cluster' => $clusterIndex,
                        ]);

                        break;
                    }
                }
            }
        }

        return [
            'ok' => true,
            'clusters' => $clusters,
        ];
    }

    private function getAgeGroup(int $age): int
    {
        if ($age <= 17) return 0;
        if ($age <= 22) return 1;
        if ($age <= 30) return 2;
        if ($age <= 45) return 3;
        return 4;
    }

    private function getRoleCode(?string $roleName, ?string $category): int
    {
        if ($roleName === 'Student' || $category === 'rcy') return 0;
        if ($roleName === 'Faculty') return 1;
        if ($roleName === 'Staff') return 2;
        return 3;
    }
}