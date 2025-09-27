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
        Schema::table('user_infos', function (Blueprint $table) {
            // Drop the string columns we mistakenly added
            if (Schema::hasColumn('user_infos', 'home_address')) {
                $table->dropColumn('home_address');
            }
            if (Schema::hasColumn('user_infos', 'present_address')) {
                $table->dropColumn('present_address');
            }
            if (Schema::hasColumn('user_infos', 'guardian_name')) {
                $table->dropColumn('guardian_name');
            }
            if (Schema::hasColumn('user_infos', 'guardian_contact')) {
                $table->dropColumn('guardian_contact');
            }

            // Restore foreign keys to separate tables
            if (!Schema::hasColumn('user_infos', 'home_address_id')) {
                $table->unsignedBigInteger('home_address_id')->nullable()->after('sex');
                $table->foreign('home_address_id')
                      ->references('id')->on('home_addresses')
                      ->onDelete('set null');
            }

            if (!Schema::hasColumn('user_infos', 'present_address_id')) {
                $table->unsignedBigInteger('present_address_id')->nullable()->after('home_address_id');
                $table->foreign('present_address_id')
                      ->references('id')->on('present_addresses')
                      ->onDelete('set null');
            }

            if (!Schema::hasColumn('user_infos', 'guardian_id')) {
                $table->unsignedBigInteger('guardian_id')->nullable()->after('present_address_id');
                $table->foreign('guardian_id')
                      ->references('id')->on('guardians')
                      ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_infos', function (Blueprint $table) {
            // Drop foreign keys & columns
            $table->dropForeign(['home_address_id']);
            $table->dropForeign(['present_address_id']);
            $table->dropForeign(['guardian_id']);

            $table->dropColumn(['home_address_id', 'present_address_id', 'guardian_id']);

            // Restore simple columns
            $table->string('home_address')->nullable();
            $table->string('present_address')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_contact')->nullable();
        });
    }
};
