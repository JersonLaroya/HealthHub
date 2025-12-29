<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('home_address_id')
                  ->references('id')->on('addresses')
                  ->restrictOnDelete();

            $table->foreign('present_address_id')
                  ->references('id')->on('addresses')
                  ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['home_address_id']);
            $table->dropForeign(['present_address_id']);
        });
    }
};

