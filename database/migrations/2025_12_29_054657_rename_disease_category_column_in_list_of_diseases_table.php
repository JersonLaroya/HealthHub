<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('list_of_diseases', function (Blueprint $table) {
            $table->renameColumn('disease_categories_id', 'disease_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('list_of_diseases', function (Blueprint $table) {
            $table->renameColumn('disease_category_id', 'disease_categories_id');
        });
    }
};
