<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('ismis_id');
            $table->index('first_name');
            $table->index('last_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['ismis_id']);
            $table->dropIndex(['first_name']);
            $table->dropIndex(['last_name']);
        });
    }
};
