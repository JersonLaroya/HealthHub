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
        Schema::table('users', function (Blueprint $table) {
            // Add column after id or user_type_id for readability (optional)
            $table->foreignId('user_role_id')
                  ->nullable()
                  ->after('id') // or ->after('user_type_id')
                  ->constrained('user_roles')
                  ->nullOnDelete(); // prevents foreign key errors if role is deleted
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_role_id');
        });
    }
};
