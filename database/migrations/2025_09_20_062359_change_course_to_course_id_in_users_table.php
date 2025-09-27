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
            // Drop old varchar column
            if (Schema::hasColumn('users', 'course')) {
                $table->dropColumn('course');
            }

            // Add new foreign key column
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('course')->nullable();
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });
    }
};
