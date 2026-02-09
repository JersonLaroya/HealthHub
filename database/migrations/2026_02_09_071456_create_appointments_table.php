<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Who requested the appointment
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Admin or Nurse who handled it
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Schedule
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time');

            // Details
            $table->string('purpose');
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();

            // Status
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'completed'
            ])->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
