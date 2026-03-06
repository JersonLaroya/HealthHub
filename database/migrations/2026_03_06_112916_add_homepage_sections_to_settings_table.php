<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->json('clinic_accomplishments')->nullable()->after('school_year');
            $table->json('homepage_services')->nullable()->after('clinic_accomplishments');
            $table->json('healthcare_professionals')->nullable()->after('homepage_services');
            $table->json('healthhub_tour')->nullable()->after('healthcare_professionals');
            $table->json('footer_content')->nullable()->after('healthhub_tour');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'clinic_accomplishments',
                'homepage_services',
                'healthcare_professionals',
                'healthhub_tour',
                'footer_content',
            ]);
        });
    }
};