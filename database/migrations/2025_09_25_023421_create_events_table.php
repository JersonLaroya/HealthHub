<?php

// database/migrations/xxxx_xx_xx_create_events_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();

            // creator of the event
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // last editor of the event
            $table->foreignId('edited_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
