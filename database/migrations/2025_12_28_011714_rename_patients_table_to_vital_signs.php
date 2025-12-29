<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('patients', 'vital_signs');
    }

    public function down(): void
    {
        Schema::rename('vital_signs', 'patients');
    }
};

