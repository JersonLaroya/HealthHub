<?php

namespace Database\Seeders;

use App\Models\LaboratoryType;
use Illuminate\Database\Seeder;

class LaboratoryTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Chest X-Ray',
            'Stool Exam',
            'Urinalysis',
            'Complete Blood Count',
            'Drug Test',
            'HbSAg',
            'Ishihara Test',
            'Neuro-Psychiatric Test',
        ];

        foreach ($types as $type) {
            LaboratoryType::firstOrCreate([
                'name' => $type
            ]);
        }
    }
}
