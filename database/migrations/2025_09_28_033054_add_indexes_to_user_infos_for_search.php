<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;

class AddIndexesToUserInfosForSearch extends Migration
{
    public function up()
    {
        DB::statement('CREATE INDEX userinfo_lower_first_name_idx ON user_infos (LOWER(first_name));');
        DB::statement('CREATE INDEX userinfo_lower_last_name_idx ON user_infos (LOWER(last_name));');
    }

    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS userinfo_lower_first_name_idx;');
        DB::statement('DROP INDEX IF EXISTS userinfo_lower_last_name_idx;');
    }
}
