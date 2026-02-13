<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // if not yet indexed
            $table->index('user_role_id');
        });

        Schema::table('user_roles', function (Blueprint $table) {
            $table->index('name');
            $table->index('category');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_key', 'id']);
            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index(['receiver_id', 'is_seen']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['user_role_id']);
        });

        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['category']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_key', 'id']);
            $table->dropIndex(['sender_id']);
            $table->dropIndex(['receiver_id']);
            $table->dropIndex(['receiver_id', 'is_seen']);
        });
    }
};

