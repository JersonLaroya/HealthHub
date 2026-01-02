<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DiseaseCategory;
use App\Models\Disease;

class DiseaseSeeder extends Seeder
{
    public function run()
    {
        $data = [
            'SKIN' => [
                'Abrasion',
                'Allergy',
                'Burns',
                'Laceration',
                'Paronychia',
                'Punctured Wound',
                'Rash',
                'Bruise',
                'Ingrown Nail',
                'Skin Lesions',
                'Fungal Infection',
            ],
            'HEAD' => [
                'Headache',
                'Contusion',
                'Seizure/ Pre-seizure attack',
            ],
            'EYES' => [
                'Error of Refraction',
                'Eye Irritation',
                'Stye',
                'Swollen Eyelids',
            ],
            'MOUTH AND ENT' => [
                'Allergic Rhinitis',
                'Ear Pain',
                'Sinusitis',
                'Sore Throat',
                'Tonsilitis (Suppurative)',
                'Nosebleed',
                'Toothache',
                'Swollen Face',
            ],
            'RESPIRATORY' => [
                'Asthma',
                'Hyperventilation',
                'Shortness of Breath',
            ],
            'CARDIOVASCULAR AND CIRCULATORY' => [
                'Anemia',
                'Chest Pain',
                'Dizziness',
                'Fainting',
                'Hypertension',
                'Hypotension',
            ],
            'GASTROINTESTINAL' => [
                'Abdominal Pain',
                'Diarrhea',
                'Hyperacidity',
                'Vomiting',
                'Stomachache',
            ],
            'GENITOURINARY' => [
                'Kidney Stones',
                'UTI',
            ],
            'REPRODUCTIVE' => [
                'Dysmenorrhea',
                'Inguinal Pain',
                'Vaginal Bleeding',
            ],
            'NEUROMUSCULAR/ SKELETAL/ JOINTS' => [
                'Arthritis',
                'Bruise',
                'Joint Pain',
                'Muscle Pain',
                'Swelling',
                'Backpain',
                'Sprain',
                'Swollen Lymph Nodes',
                'Stiff Neck',
            ],
            'INFECTIOUS DISEASE' => [
                'Abcess',
                'Chicken Pox',
                'Colds',
                'Conjunctivitis',
                'Cough',
                'Dengue',
                'Fever',
                'Flu-like Symptoms',
                'Measles',
                'Tuberculosis (ongoing treatment)',
                'Tuberculosis (New Case)',
                'Tuberculosis (Past History)',
            ],
        ];

        foreach ($data as $categoryName => $diseases) {
            $category = DiseaseCategory::firstOrCreate(
                ['name' => $categoryName],
                ['created_by' => 2] // set created_by to 2
            );

            foreach ($diseases as $diseaseName) {
                Disease::firstOrCreate(
                    [
                        'name' => $diseaseName,
                        'disease_category_id' => $category->id,
                    ],
                    ['created_by' => 2] // set created_by to 2
                );
            }
        }
    }
}
