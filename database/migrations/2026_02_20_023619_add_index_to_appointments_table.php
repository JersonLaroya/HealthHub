<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {

            // composite index for slot availability queries
            $table->index(['appointment_date', 'start_time', 'status'], 'appointments_slot_index');

            $table->index(['user_id', 'status'], 'appointments_user_status_index');

        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {

            $table->dropIndex('appointments_slot_index');

        });
    }
};