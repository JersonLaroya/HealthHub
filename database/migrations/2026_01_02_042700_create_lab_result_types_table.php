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
    Schema::create('lab_result_types', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique(); // e.g., X-ray, Urinalysis
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('lab_result_types');
}

};
