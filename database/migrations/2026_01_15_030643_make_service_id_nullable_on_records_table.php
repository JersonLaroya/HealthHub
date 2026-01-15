<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('records', function (Blueprint $table) {
            // 1. drop the existing foreign key
            $table->dropForeign(['service_id']);

            // 2. make the column nullable
            $table->foreignId('service_id')->nullable()->change();

            // 3. add foreign key back (nullable)
            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('records', function (Blueprint $table) {
            // rollback: make it required again
            $table->dropForeign(['service_id']);

            $table->foreignId('service_id')->nullable(false)->change();

            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->cascadeOnDelete();
        });
    }
};
