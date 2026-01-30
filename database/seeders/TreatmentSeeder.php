<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Treatment;

class TreatmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $treatments = [
            'Allergy Management',
            'Animal Bite',
            'BP Monitoring',
            'CBS Monitoring',
            'Clinic Pass',
            'Fever Management',
            'Flu Vaccination',
            'Height/ Weight Monitoring',
            'Insurance Claims',
            'Referrals (to laboratories)',
            'Referrals (to hospital, RHU, other doctors)',
            'Referrals (guidance)',
            'Recommendation Letter',
            'Release of Medicine',
            'Release of Vitamins',
            'RHD Treatment',
            'Sick Leaves',
            'Suture Removal',
            'Tetanus Vaccinations',
            'Tooth Extraction',
            'Vital Signs Monitoring',
            'Wound Dressing',
        ];

        foreach ($treatments as $name) {
            Treatment::firstOrCreate(['name' => $name]);
        }
    }
}
