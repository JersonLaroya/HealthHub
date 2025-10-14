<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_assignments', function (Blueprint $table) {
            // Drop user_id if it exists
            if (Schema::hasColumn('form_assignments', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }

            // Add patient_id referencing patients.id
            if (!Schema::hasColumn('form_assignments', 'patient_id')) {
                $table->foreignId('patient_id')
                      ->after('form_id')
                      ->constrained('patients')
                      ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('form_assignments', function (Blueprint $table) {
            // Drop patient_id if rollback
            if (Schema::hasColumn('form_assignments', 'patient_id')) {
                $table->dropConstrainedForeignId('patient_id');
            }

            // Add back user_id if needed
            $table->foreignId('user_id')
                  ->after('form_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
        });
    }
};
