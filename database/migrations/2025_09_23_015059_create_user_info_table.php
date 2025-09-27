<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_info', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique(); // assuming one-to-one with users
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('contact_no')->nullable();
            $table->date('birthday')->nullable();
            $table->enum('sex', ['Male', 'Female', 'Other'])->nullable();
            $table->unsignedBigInteger('home_address_id')->nullable();
            $table->unsignedBigInteger('present_address_id')->nullable();
            $table->unsignedBigInteger('guardian_id')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('home_address_id')->references('id')->on('home_addresses')->onDelete('set null');
            $table->foreign('present_address_id')->references('id')->on('present_addresses')->onDelete('set null');
            $table->foreign('guardian_id')->references('id')->on('guardians')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_info');
    }
};
