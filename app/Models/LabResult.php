<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'results',
    ];

    protected $casts = [
        'results' => 'array',
    ];

    // Optional: if you want to know which record this lab result belongs to
    public function record()
    {
        return $this->hasOne(Record::class, 'lab_result_id');
    }
}
