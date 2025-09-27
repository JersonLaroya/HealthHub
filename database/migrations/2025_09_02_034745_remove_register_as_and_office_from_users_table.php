<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'register_as')) {
                $table->dropColumn('register_as');
            }
            if (Schema::hasColumn('users', 'office')) {
                $table->dropColumn('office');
            }
        });

    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('register_as')->nullable();
            $table->string('office')->nullable();
        });
    }
};
