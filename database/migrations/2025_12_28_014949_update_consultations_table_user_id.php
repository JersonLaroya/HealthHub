<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Drop foreign key and column for patient_id
            if (Schema::hasColumn('consultations', 'patient_id')) {
                $table->dropForeign(['patient_id']); // drop FK constraint first
                $table->dropColumn('patient_id');
            }

            // Add user_id column and FK
            $table->foreignId('user_id')->after('id')->constrained('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Drop user_id FK and column
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Add patient_id back (optional, depending on rollback)
            $table->foreignId('patient_id')->after('id')->constrained('patients')->cascadeOnDelete();
        });
    }
};

