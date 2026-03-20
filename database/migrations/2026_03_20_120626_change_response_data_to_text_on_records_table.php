<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE records ALTER COLUMN response_data TYPE TEXT USING response_data::text');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE records ALTER COLUMN response_data TYPE JSONB USING response_data::jsonb');
    }
};