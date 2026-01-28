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
    Schema::table('records', function (Blueprint $table) {
        $table->json('response_data')->nullable()->change();
    });
}

public function down()
{
    Schema::table('records', function (Blueprint $table) {
        $table->json('response_data')->nullable(false)->change();
    });
}

};
