<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('home_addresses', function (Blueprint $table) {
            if (Schema::hasColumn('home_addresses', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });

        Schema::table('present_addresses', function (Blueprint $table) {
            if (Schema::hasColumn('present_addresses', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('home_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });

        Schema::table('present_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
    }
};
