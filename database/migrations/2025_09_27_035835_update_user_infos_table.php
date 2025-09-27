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
        // Rename birthday → birthdate
        if (Schema::hasColumn('user_infos', 'birthday')) {
            $table->renameColumn('birthday', 'birthdate');
        }

        // Add suffix
        if (!Schema::hasColumn('user_infos', 'suffix')) {
            $table->string('suffix')->nullable()->after('last_name');
        }

        // Change addresses from foreign key to string
        if (!Schema::hasColumn('user_infos', 'home_address')) {
            $table->string('home_address')->nullable()->after('sex');
        }
        if (!Schema::hasColumn('user_infos', 'present_address')) {
            $table->string('present_address')->nullable()->after('home_address');
        }

        // Remove guardian_id and replace with simple fields
        if (Schema::hasColumn('user_infos', 'guardian_id')) {
            $table->dropColumn('guardian_id');
        }

        if (!Schema::hasColumn('user_infos', 'guardian_name')) {
            $table->string('guardian_name')->nullable()->after('present_address');
        }
        if (!Schema::hasColumn('user_infos', 'guardian_contact')) {
            $table->string('guardian_contact')->nullable()->after('guardian_name');
        }

        // Ensure sex stays as string
        $table->string('sex')->nullable()->change();
    });
}

public function down(): void
{
    Schema::table('user_infos', function (Blueprint $table) {
        $table->renameColumn('birthdate', 'birthday');
        $table->dropColumn(['suffix', 'home_address', 'present_address', 'guardian_name', 'guardian_contact']);
        $table->unsignedBigInteger('guardian_id')->nullable();
        $table->string('sex')->nullable()->change();
    });
}

};
