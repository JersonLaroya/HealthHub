<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('lab_result_types');
    }

    public function down(): void
    {
        Schema::create('lab_result_types', function ($table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
    }
};
