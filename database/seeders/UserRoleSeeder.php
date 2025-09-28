<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserRole;

class UserRoleSeeder extends Seeder
{
    public function run()
    {
        // ⚠️ Truncate table to start fresh
        UserRole::truncate();

        // Seed new roles
        $roles = [
            ['name' => 'Super Admin', 'is_personnel' => false],
            ['name' => 'Admin',       'is_personnel' => false],
            ['name' => 'Head Nurse',  'is_personnel' => true],
            ['name' => 'Nurse',       'is_personnel' => true],
            ['name' => 'Student',     'is_personnel' => false],
            ['name' => 'Staff',     'is_personnel' => false],
            ['name' => 'Faculty',     'is_personnel' => false],
        ];

        foreach ($roles as $role) {
            UserRole::create($role);
        }

        $this->command->info('User roles seeded successfully!');
    }
}
