<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dtr extends Model
{
    use HasFactory;

    protected $fillable = [
        'purpose',
        'management',
        'dtr_date',
        'dtr_time',
        'name',
        'sex',
        'age',
        'course_year_office',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
