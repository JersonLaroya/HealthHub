<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'code' column to barangays
        Schema::table('barangays', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('name');
        });

        // Add 'code' column to municipalities
        Schema::table('municipalities', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('name');
        });

        // Add 'code' column to provinces
        Schema::table('provinces', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn('code');
        });

        Schema::table('municipalities', function (Blueprint $table) {
            $table->dropColumn('code');
        });

        Schema::table('provinces', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
