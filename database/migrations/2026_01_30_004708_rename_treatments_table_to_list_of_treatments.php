<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::rename('treatments', 'list_of_treatments');
    }

    public function down()
    {
        Schema::rename('list_of_treatments', 'treatments');
    }
};

