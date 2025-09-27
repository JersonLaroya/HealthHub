<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Office;
use Carbon\Carbon;

class OfficesTableSeeder extends Seeder
{
    public function run(): void
    {
        $offices = [
            'Admin Office',
            'Alumni Office',
            'BAC Office',
            'Campus Director Office',
            'College of Business and Management',
            'College of Fisheries and Marine Sciences',
            'College of Sciences',
            'College of Teacher Education',
            'Future Technology of the Philippines',
            'Gender and Development office',
            'Guidance Office',
            'Harpooner',
            'Learning Management System',
            'Library',
            'Management Information System Office',
            'None',
            'Office Supply',
            'Planning and Strategic Foresight Office',
            'Procurement Office',
            'Quality Assurance',
            "Registrar's Office",
            'Research, Innovation, and Extension Office',
            'School of Advance Studies',
            'University Health Services',
        ];

        foreach ($offices as $officeName) {
            $office = Office::firstOrCreate(
                ['name' => $officeName],
                ['created_at' => Carbon::now(), 'updated_at' => Carbon::now()]
            );

            // Update timestamps if they were null
            if (is_null($office->created_at) || is_null($office->updated_at)) {
                $office->update([
                    'created_at' => $office->created_at ?? Carbon::now(),
                    'updated_at' => $office->updated_at ?? Carbon::now(),
                ]);
            }
        }
    }
}
