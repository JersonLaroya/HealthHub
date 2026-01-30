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
        Schema::create('inquiry_list_of_inquiry', function (Blueprint $table) {
            $table->id();

            $table->foreignId('inquiry_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('list_of_inquiry_id')
                ->constrained('list_of_inquiries')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['inquiry_id', 'list_of_inquiry_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiry_list_of_inquiry');
    }
};
