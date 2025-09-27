<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('year_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "1st Year", "2nd Year"
            $table->integer('level'); // numeric value 1,2,3,4
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('year_levels');
    }
};

