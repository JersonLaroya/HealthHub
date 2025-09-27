<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class YearLevelsSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('year_levels')->insert([
            ['name' => '1st Year', 'level' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => '2nd Year', 'level' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => '3rd Year', 'level' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['name' => '4th Year', 'level' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
