<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CensusExport implements FromArray, WithHeadings
{
    protected $from, $to, $group;

    public function __construct($from, $to, $group)
    {
        $this->from = $from;
        $this->to = $to;
        $this->group = $group;
    }

    public function headings(): array
    {
        return [
            'Campus',
            'Category',
            'Name',
            'Total',
        ];
    }

    public function array(): array
    {
        // 🔹 Fixed campus (Candijay only)
        $campus = 'Candijay';

        $rows = [];

        // WELL CENSUS
        $well = DB::table('list_of_inquiries as loi')
            ->leftJoin('inquiry_list_of_inquiry as ili', 'ili.list_of_inquiry_id', '=', 'loi.id')
            ->leftJoin('inquiries as i', function ($join) {
                $join->on('ili.inquiry_id', '=', 'i.id')
                     ->whereBetween('i.created_at', [$this->from, $this->to]);
            })
            ->select('loi.name', DB::raw('COUNT(i.id) as total'))
            ->groupBy('loi.name')
            ->orderBy('loi.name')
            ->get();

        foreach ($well as $row) {
            $rows[] = [$campus, 'Well', $row->name, $row->total];
        }

        // SICK CENSUS
        $sick = DB::table('list_of_diseases as d')
            ->leftJoin('consultation_disease as cd', 'cd.disease_id', '=', 'd.id')
            ->leftJoin('consultations as c', function ($join) {
                $join->on('cd.consultation_id', '=', 'c.id')
                     ->whereBetween('c.date', [$this->from, $this->to]);
            })
            ->select('d.name', DB::raw('COUNT(c.id) as total'))
            ->groupBy('d.name')
            ->orderBy('d.name')
            ->get();

        foreach ($sick as $row) {
            $rows[] = [$campus, 'Sick', $row->name, $row->total];
        }

        return $rows;
    }
}
