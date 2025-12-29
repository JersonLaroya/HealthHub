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
    Schema::table('form_assignments', function (Blueprint $table) {
        $table->dropColumn('submitted_at');
    });
}

public function down()
{
    Schema::table('form_assignments', function (Blueprint $table) {
        $table->timestamp('submitted_at')->nullable();
    });
}

};
