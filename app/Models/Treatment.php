<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use HasFactory;

    protected $table = 'list_of_treatments';

    protected $fillable = [
        'name',
    ];

    public function consultations()
    {
        return $this->belongsToMany(
            Consultation::class,
            'consultation_treatment'
        );
    }
}
