<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;

class SameNameUsersSeeder extends Seeder
{
    public function run(): void
    {
        $firstName = 'Kenneth';
        $middleName = 'Rayco';
        $lastName = 'Gutierrez';

        for ($i = 1; $i <= 20; $i++) {

            $courseId = rand(1, 11);

            // office mapping based on course_id
            if (in_array($courseId, [1, 2])) {
                $officeId = 6;
            } elseif (in_array($courseId, [3, 10])) {
                $officeId = 7;
            } elseif ($courseId >= 4 && $courseId <= 8) {
                $officeId = 8;
            } elseif (in_array($courseId, [9, 11])) {
                $officeId = 5;
            } else {
                $officeId = null; // fallback (just in case)
            }

            User::create([
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'email' => "kenneth.gutierrez{$i}@testmail.com",
                'password' => bcrypt('password'),

                'course_id' => $courseId,
                'year_level_id' => rand(1, 4),
                'office_id' => $officeId,

                'remember_token' => Str::random(10),
            ]);
        }
    }
}
