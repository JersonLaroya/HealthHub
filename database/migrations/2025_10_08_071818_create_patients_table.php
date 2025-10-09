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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); 

            // Initial vital signs (recorded once)
            $table->string('bp')->nullable();    // blood pressure
            $table->string('rr')->nullable();    // respiratory rate
            $table->string('pr')->nullable();    // pulse rate
            $table->string('temp')->nullable();  // temperature
            $table->string('o2_sat')->nullable(); // oxygen saturation

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
