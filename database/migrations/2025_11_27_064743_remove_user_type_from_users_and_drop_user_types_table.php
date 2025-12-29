<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove the column from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_type_id']); // drop FK first
            $table->dropColumn('user_type_id');    // then drop the column
        });

        // Drop the user_types table
        Schema::dropIfExists('user_types');
    }

    public function down(): void
    {
        // Recreate the user_types table
        Schema::create('user_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Add user_type_id column back to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('user_type_id')
                  ->nullable() // adjust if it was nullable
                  ->constrained('user_types');
        });
    }
};
