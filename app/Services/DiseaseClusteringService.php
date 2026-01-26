<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Disease;
use App\Models\ConsultationCluster;
use Carbon\Carbon;
use Phpml\Clustering\KMeans;

class DiseaseClusteringService
{
    public function cluster(int $k = 3)
    {
        $diseases = Disease::orderBy('id')->get();

        $consultations = Consultation::has('diseases')
            ->with(['diseases', 'user.userRole'])
            ->get();

        $samples = [];
        $consultationMap = [];

        foreach ($consultations as $consultation) {

            if (!$consultation->user || !$consultation->date) {
                continue;
            }

            if ($consultation->diseases->isEmpty()) {
                continue;
            }

            // -------------------
            // PEOPLE FEATURES
            // -------------------

            $age = Carbon::parse($consultation->user->birthdate)
                ->diffInYears(Carbon::parse($consultation->date));

            $ageGroup = $this->getAgeGroup($age);

            $roleName = $consultation->user->userRole->name ?? null;
            $category = $consultation->user->userRole->category ?? null;

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
            throw new \Exception("Not enough consultations to form {$k} clusters.");
        }

        $kmeans = new KMeans($k);
        $clusters = $kmeans->cluster($samples);

        ConsultationCluster::truncate();

        // SAFE mapping
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

        return $clusters;
    }

    // -------------------
    // HELPERS
    // -------------------

    private function getAgeGroup(int $age): int
    {
        if ($age <= 17) return 0;        // Under 18
        if ($age <= 22) return 1;        // College age
        if ($age <= 30) return 2;        // Young adult
        if ($age <= 45) return 3;        // Adult
        return 4;                        // Older adult
    }

    private function getRoleCode(?string $roleName, ?string $category): int
    {
        if ($roleName === 'Student' || $category === 'rcy') return 0;
        if ($roleName === 'Faculty') return 1;
        if ($roleName === 'Staff') return 2;
        return 3;
    }
}
