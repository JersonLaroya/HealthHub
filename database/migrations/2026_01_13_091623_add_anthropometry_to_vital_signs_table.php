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
    Schema::table('vital_signs', function (Blueprint $table) {
        $table->string('height')->nullable()->after('o2_sat');
        $table->string('weight')->nullable()->after('height');
        $table->string('bmi')->nullable()->after('weight');
    });
}

public function down()
{
    Schema::table('vital_signs', function (Blueprint $table) {
        $table->dropColumn(['height', 'weight', 'bmi']);
    });
}

};
