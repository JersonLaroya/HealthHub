<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->after('middle_name');
            $table->string('suffix')->nullable()->after('last_name');

            $table->char('sex', 1)->after('suffix'); // M / F
            $table->date('birthdate')->after('sex');
            $table->string('contact_no')->after('birthdate');

            $table->string('guardian_name')->nullable()->after('contact_no');
            $table->string('guardian_contact_no')->nullable()->after('guardian_name');

            $table->unsignedBigInteger('home_address_id')->nullable()->after('guardian_contact_no');
            $table->unsignedBigInteger('present_address_id')->nullable()->after('home_address_id');

            $table->text('signature')->nullable()->after('present_address_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'middle_name',
                'last_name',
                'suffix',
                'sex',
                'birthdate',
                'contact_no',
                'guardian_name',
                'guardian_contact_no',
                'home_address_id',
                'present_address_id',
                'signature',
            ]);
        });
    }
};
