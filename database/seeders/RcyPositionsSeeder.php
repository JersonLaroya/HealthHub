<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RcyPosition;

class RcyPositionsSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            'PRESIDENT',
            'VICE-PRESIDENT',
            'SECRETARY',
            'TREASURER',
            'PHOTO JOURNALIST',
            'LAYOUT ARTIST',
            'WRITER/ CAPTION EDITOR',
            'MUSE',
            'ESCORT',

            'YVFC CHAIRPERSON',
            'YVFC CO-CHAIRPERSON',

            'EFAT CHAIRPERSON',
            'EFAT CO-CHAIRPERSON',

            'HAPE/ SAPE CHAIRPERSON',
            'HAPE/SAPE CO-CHAIRPERSON',

            'PLEDGE 25 CHAIRPERSON',
            'PLEDGE 25 CO-CHAIRPERSON',

            'ANTI - TB CHAIRPERSON',
            'ANTI - TB CO-CHAIRPERSON',

            "MOTHER'S CLASS CHAIRPERSON",
            "MOTHER'S CLASS CO-CHAIRPERSON",

            'DRRM CHAIRPERSON',
            'DRRM CO-CHAIRPERSON',

            'OUTREACH CHAIRPERSON',
            'OUTREACH CO-CHAIRPERSON',

            'CHRISTMAS PARTY CHAIRPERSON',
            'CHRISTMAS PARTY CO-CHAIRPERSON',
        ];

        foreach ($positions as $pos) {
            RcyPosition::firstOrCreate(['name' => $pos]);
        }
    }
}
