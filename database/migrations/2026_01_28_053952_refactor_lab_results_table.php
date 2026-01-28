<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {

            // 1. remove old results column if you no longer need it
            if (Schema::hasColumn('lab_results', 'results')) {
                $table->dropColumn('results');
            }

            // 2. add laboratory_request_item_id
            if (!Schema::hasColumn('lab_results', 'laboratory_request_item_id')) {
                $table->foreignId('laboratory_request_item_id')
                      ->nullable()
                      ->constrained()
                      ->cascadeOnDelete()
                      ->after('id');
            }

            // 3. add images json column
            if (!Schema::hasColumn('lab_results', 'images')) {
                $table->json('images')->nullable()->after('laboratory_request_item_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {

            if (Schema::hasColumn('lab_results', 'laboratory_request_item_id')) {
                $table->dropForeign(['laboratory_request_item_id']);
                $table->dropColumn('laboratory_request_item_id');
            }

            if (Schema::hasColumn('lab_results', 'images')) {
                $table->dropColumn('images');
            }

            // restore results if rolled back
            if (!Schema::hasColumn('lab_results', 'results')) {
                $table->json('results')->nullable();
            }
        });
    }
};
