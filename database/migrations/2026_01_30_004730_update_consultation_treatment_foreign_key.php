<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('consultation_treatment', function (Blueprint $table) {
            $table->dropForeign(['treatment_id']);

            $table->foreign('treatment_id')
                ->references('id')
                ->on('list_of_treatments')
                ->cascadeOnDelete();
        });
    }

    public function down()
    {
        Schema::table('consultation_treatment', function (Blueprint $table) {
            $table->dropForeign(['treatment_id']);

            $table->foreign('treatment_id')
                ->references('id')
                ->on('treatments')
                ->cascadeOnDelete();
        });
    }
};

