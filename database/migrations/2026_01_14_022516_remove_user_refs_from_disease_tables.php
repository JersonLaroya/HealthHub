<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('disease_categories', function (Blueprint $table) {

            if (Schema::hasColumn('disease_categories', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('disease_categories', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }

        });

        Schema::table('list_of_diseases', function (Blueprint $table) {

            if (Schema::hasColumn('list_of_diseases', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

        });
    }

    public function down(): void
    {
        Schema::table('disease_categories', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('list_of_diseases', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }
};

