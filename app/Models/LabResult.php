<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_result_type_id',
        'filepath',
    ];

    public function type()
    {
        return $this->belongsTo(LabResultType::class, 'lab_result_type_id');
    }
}
