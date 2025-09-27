<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserType;

class UserTypesTableSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Student', 'Faculty', 'Staff', 'Nurse', 'Admin'];

        foreach ($types as $type) {
            UserType::firstOrCreate(['name' => $type]);
        }
    }
}
