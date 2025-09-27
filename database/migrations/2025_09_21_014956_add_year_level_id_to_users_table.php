<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('year_level_id')
                  ->nullable()
                  ->constrained('year_levels') // references id in year_levels table
                  ->nullOnDelete(); // if a year level is deleted, set to null
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['year_level_id']);
            $table->dropColumn('year_level_id');
        });
    }
};
