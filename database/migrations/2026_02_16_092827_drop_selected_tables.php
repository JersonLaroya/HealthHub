<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop child tables first (important for foreign keys)
        Schema::dropIfExists('form_responses');
        Schema::dropIfExists('form_assignments');
        Schema::dropIfExists('present_addresses');
        Schema::dropIfExists('home_addresses');
        Schema::dropIfExists('rcy_members');
        Schema::dropIfExists('rcy_positions');
        Schema::dropIfExists('user_infos');
        Schema::dropIfExists(table: 'dtrs');
        Schema::dropIfExists(table: 'guardians');
    }

    public function down(): void
    {
        // Optional: recreate tables if needed
    }
};

