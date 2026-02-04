<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Office;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $usedIsmis = User::pluck('ismis_id')->toArray();

        $generateIsmis = function () use (&$usedIsmis) {
            do {
                $id = random_int(100000, 999999);
            } while (in_array($id, $usedIsmis));

            $usedIsmis[] = $id;
            return $id;
        };

        $courses = Course::with('office')->get();
        $officeIds = Office::pluck('id');

        $users = [];

        for ($i = 1; $i <= 100; $i++) {

            // 5 = Student, 6 = Staff, 7 = Faculty
            $role = collect([5, 6, 7])->random();

            $course = null;
            $yearLevel = null;
            $officeId = null;

            if ($role === 5) {
                // Student
                $course = $courses->random();
                $officeId = $course->office_id;
                $yearLevel = random_int(1, 4);
            } else {
                // Staff / Faculty
                $officeId = $officeIds->random();
            }

            $users[] = [
                'email' => "testuser{$i}@example.com",
                'password' => Hash::make('password'),

                // profile
                'first_name' => "Test{$i}",
                'middle_name' => null,
                'last_name' => 'User',
                'suffix' => null,
                'sex' => collect(['Male', 'Female'])->random(),
                'birthdate' => now()->subYears(random_int(18, 35))->format('Y-m-d'),
                'contact_no' => '09' . random_int(100000000, 999999999),
                'guardian_name' => $role === 5 ? 'Guardian Name' : null,
                'guardian_contact_no' => $role === 5 ? '09' . random_int(100000000, 999999999) : null,
                'signature' => null,
                'ismis_id' => $generateIsmis(),

                // addresses
                'home_address_id' => null,
                'present_address_id' => null,

                // auth / role
                'google_id' => null,
                'google_token' => null,
                'google_refresh_token' => null,
                'user_role_id' => $role,
                'office_id' => $officeId,
                'course_id' => $course?->id,
                'year_level_id' => $yearLevel,

                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        User::insert($users);
    }
}
