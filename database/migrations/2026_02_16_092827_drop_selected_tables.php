<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Most dependent tables first
        Schema::dropIfExists('form_responses');
        Schema::dropIfExists('form_assignments');
        Schema::dropIfExists('dtrs');

        // user_infos depends on guardians + addresses, so drop it BEFORE them
        Schema::dropIfExists('user_infos');

        // Now drop the tables referenced by user_infos
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('present_addresses');
        Schema::dropIfExists('home_addresses');

        // Other tables
        Schema::dropIfExists('rcy_members');
        Schema::dropIfExists('rcy_positions');
    }

    public function down(): void
    {
        // Optional
    }
};