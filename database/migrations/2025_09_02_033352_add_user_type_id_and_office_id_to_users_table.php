<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add user_type_id if it doesn't exist
            if (!Schema::hasColumn('users', 'user_type_id')) {
                $table->foreignId('user_type_id')
                      ->nullable()
                      ->after('id')
                      ->constrained('user_types')
                      ->cascadeOnDelete();
            }

            // Add office_id if it doesn't exist
            if (!Schema::hasColumn('users', 'office_id')) {
                $table->foreignId('office_id')
                      ->nullable()
                      ->after('user_type_id')
                      ->constrained('offices')
                      ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign keys if they exist
            if (Schema::hasColumn('users', 'user_type_id')) {
                $table->dropForeign(['user_type_id']);
                $table->dropColumn('user_type_id');
            }

            if (Schema::hasColumn('users', 'office_id')) {
                $table->dropForeign(['office_id']);
                $table->dropColumn('office_id');
            }
        });
    }
};
