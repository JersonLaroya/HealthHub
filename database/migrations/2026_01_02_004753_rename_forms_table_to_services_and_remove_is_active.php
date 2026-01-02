<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename table
        Schema::rename('forms', 'services');

        // 2. Remove is_active column
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }

    public function down(): void
    {
        // Re-add is_active column
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
        });

        // Rename table back
        Schema::rename('services', 'forms');
    }
};
