<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {

            // add results column
            if (!Schema::hasColumn('lab_results', 'results')) {
                $table->json('results')->nullable()->after('id');
            }

            // drop old columns if they exist
            if (Schema::hasColumn('lab_results', 'lab_result_type_id')) {
                $table->dropConstrainedForeignId('lab_result_type_id');
            }

            if (Schema::hasColumn('lab_results', 'filepath')) {
                $table->dropColumn('filepath');
            }

            if (Schema::hasColumn('lab_results', 'timestamp')) {
                $table->dropColumn('timestamp');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {

            // rollback old structure
            $table->foreignId('lab_result_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('filepath')->nullable();
            $table->timestamp('timestamp')->nullable();

            $table->dropColumn('results');
        });
    }
};
