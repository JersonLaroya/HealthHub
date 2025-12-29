<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('provinces', function (Blueprint $table) {
        $table->timestamps();
    });

    Schema::table('municipalities', function (Blueprint $table) {
        $table->timestamps();
    });

    Schema::table('barangays', function (Blueprint $table) {
        $table->timestamps();
    });
}

public function down()
{
    Schema::table('provinces', function (Blueprint $table) {
        $table->dropTimestamps();
    });

    Schema::table('municipalities', function (Blueprint $table) {
        $table->dropTimestamps();
    });

    Schema::table('barangays', function (Blueprint $table) {
        $table->dropTimestamps();
    });
}

};
