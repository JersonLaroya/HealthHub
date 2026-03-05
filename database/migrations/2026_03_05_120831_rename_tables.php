<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::rename('offices', 'offices_colleges');
        Schema::rename('courses', 'courses_departments');
    }

    public function down()
    {
        Schema::rename('offices_colleges', 'offices');
        Schema::rename('courses_departments', 'courses');
    }
};