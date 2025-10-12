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
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');

            // Who submitted the consultation (nurse, admin, rcy)
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('chief_complaint')->nullable();
            $table->text('management_and_treatment')->nullable();
            $table->date('date');
            $table->time('time');

            // consultation status: pending, approved, rejected
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
