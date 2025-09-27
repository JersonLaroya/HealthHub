<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Office;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Office lookups
        $fisheriesOffice = Office::where('name', 'College of Fisheries and Marine Sciences')->first();
        $teacherEdOffice = Office::where('name', 'College of Teacher Education')->first();
        $techOffice      = Office::where('name', 'College of Sciences')->first();

        $courses = [
            // Fisheries and Marine Sciences
            ['name' => 'Bachelor of Science in Fisheries', 'code' => 'BSFi', 'office_id' => $fisheriesOffice->id],
            ['name' => 'Bachelor of Science in Marine Biology', 'code' => 'BSMB', 'office_id' => $fisheriesOffice->id],
            ['name' => 'Bachelor of Science in Environmental Science major in Coastal Resource Management', 'code' => 'BSES', 'office_id' => $fisheriesOffice->id],

            // Teacher Education
            ['name' => 'Bachelor of Elementary Education', 'code' => 'BEED', 'office_id' => $teacherEdOffice->id],
            ['name' => 'Bachelor of Secondary Education major in English', 'code' => 'BSED-ENG', 'office_id' => $teacherEdOffice->id],
            ['name' => 'Bachelor of Secondary Education major in Filipino', 'code' => 'BSED-FIL', 'office_id' => $teacherEdOffice->id],
            ['name' => 'Bachelor of Secondary Education major in Science', 'code' => 'BSED-SCI', 'office_id' => $teacherEdOffice->id],
            ['name' => 'Bachelor of Secondary Education major in Mathematics', 'code' => 'BSED-MATH', 'office_id' => $teacherEdOffice->id],

            // Technology and Allied Sciences
            ['name' => 'Bachelor of Science in Office Administration', 'code' => 'BSOA', 'office_id' => $techOffice->id],
            ['name' => 'Bachelor of Science in Computer Science', 'code' => 'BSCS', 'office_id' => $techOffice->id],
            ['name' => 'Bachelor of Science in Hospitality Management', 'code' => 'BSHM', 'office_id' => $techOffice->id],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate([
                'name'      => $course['name'],
                'code'      => $course['code'],
                'office_id' => $course['office_id'],
            ]);
        }
    }
}
