<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old table if it exists
        Schema::dropIfExists('consultations');

        // Create the new table
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // patient
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade'); // submitted by
            $table->text('medical_complaint')->nullable();
            $table->foreignId('disease_id')->nullable()->constrained('list_of_diseases')->onDelete('set null');
            $table->text('management_and_treatment')->nullable();
            $table->date('date');
            $table->time('time');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('vital_signs_id')->nullable()->constrained('vital_signs')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
