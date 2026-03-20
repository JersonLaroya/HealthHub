<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('first_name')->change();
            $table->text('middle_name')->nullable()->change();
            $table->text('last_name')->change();
            $table->text('suffix')->nullable()->change();
            $table->text('sex')->nullable()->change();
            $table->text('birthdate')->nullable()->change();
            $table->text('contact_no')->nullable()->change();
            $table->text('guardian_name')->nullable()->change();
            $table->text('guardian_contact_no')->nullable()->change();
            $table->text('signature')->nullable()->change();
            $table->text('ismis_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 255)->change();
            $table->string('middle_name', 255)->nullable()->change();
            $table->string('last_name', 255)->change();
            $table->string('suffix', 255)->nullable()->change();
            $table->string('sex', 255)->nullable()->change();
            $table->string('birthdate', 255)->nullable()->change();
            $table->string('contact_no', 255)->nullable()->change();
            $table->string('guardian_name', 255)->nullable()->change();
            $table->string('guardian_contact_no', 255)->nullable()->change();
            $table->string('signature', 255)->nullable()->change();
            $table->string('ismis_id', 255)->nullable()->change();
        });
    }
};