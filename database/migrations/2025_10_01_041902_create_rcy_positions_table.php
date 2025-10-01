<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rcy_positions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::table('rcy_members', function (Blueprint $table) {
            $table->foreignId('rcy_position_id')
                ->nullable()
                ->constrained('rcy_positions')
                ->nullOnDelete();
            // optional: drop old "position" column if you already had one
            // $table->dropColumn('position');
        });
    }

    public function down(): void
    {
        Schema::table('rcy_members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rcy_position_id');
        });

        Schema::dropIfExists('rcy_positions');
    }
};
