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
        Schema::table('rcy_members', function (Blueprint $table) {
            // Remove school_year
            $table->dropColumn('school_year');

            // Drop old position column
            $table->dropColumn('position');

            // Add position_id referencing rcy_positions
            $table->foreignId('position_id')->after('user_id')->constrained('rcy_positions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rcy_members', function (Blueprint $table) {
            // Rollback changes
            $table->dropForeign(['position_id']);
            $table->dropColumn('position_id');

            $table->string('position')->nullable();
            $table->string('school_year')->nullable();
        });
    }
};
