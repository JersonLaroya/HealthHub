<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Form;

class FormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $forms = [
            [
                'title' => 'Pre-enrollment Health Form',
                'slug' => 'pre-enrollment',
                'description' => 'For newly admitted, returning, or transfer students of BISU.',
                'is_active' => true,
            ],
            [
                'title' => 'Athlete/Performer Medical Form',
                'slug' => 'athlete-medical',
                'description' => 'For athletes and performers requiring medical clearance.',
                'is_active' => true,
            ],
            [
                'title' => 'Pre-employment Health Form',
                'slug' => 'pre-employment',
                'description' => 'For faculty and staff applicants undergoing medical evaluation.',
                'is_active' => true,
            ],
            [
                'title' => 'Laboratory Request Form',
                'slug' => 'lab-request',
                'description' => 'Used to request laboratory tests and diagnostics.',
                'is_active' => true,
            ],
        ];

        foreach ($forms as $form) {
            Form::updateOrCreate(['slug' => $form['slug']], $form);
        }
    }
}
