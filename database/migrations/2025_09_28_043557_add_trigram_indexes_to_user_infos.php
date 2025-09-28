<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Enable pg_trgm extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Create trigram indexes
        DB::statement('CREATE INDEX IF NOT EXISTS userinfo_firstname_trgm_idx ON user_infos USING gin (first_name gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS userinfo_lastname_trgm_idx ON user_infos USING gin (last_name gin_trgm_ops)');
    }

    public function down(): void
    {
        // Drop indexes if rollback
        DB::statement('DROP INDEX IF EXISTS userinfo_firstname_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS userinfo_lastname_trgm_idx');
    }
};
