<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_assignment_id',
        'response_data',
    ];

    protected $casts = [
        'response_data' => 'array', // automatically decoded from JSON
    ];

    public function assignment()
    {
        return $this->belongsTo(FormAssignment::class);
    }
}
