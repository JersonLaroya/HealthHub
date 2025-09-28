<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dtrs', function (Blueprint $table) {
            // Drop the foreign key first
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Add new patient info columns
            $table->string('name')->after('id');                 
            $table->string('sex')->nullable()->after('name');
            $table->integer('age')->nullable()->after('sex');
            $table->string('course_year_office')->nullable()->after('age');
        });
    }

    public function down(): void
    {
        Schema::table('dtrs', function (Blueprint $table) {
            // Revert: drop patient info columns
            $table->dropColumn(['name', 'sex', 'age', 'course_year_office']);

            // Add back the user_id foreign key
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
        });
    }
};
