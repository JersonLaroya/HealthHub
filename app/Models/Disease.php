<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Disease extends Model
{
    use HasFactory;

    protected $table = 'list_of_diseases';

    protected $fillable = [
        'name',
        'disease_category_id',
    ];

    /* ======================
       Relationships
    ====================== */

    public function category()
    {
        return $this->belongsTo(DiseaseCategory::class, 'disease_category_id');
    }

    public function consultations()
    {
        return $this->belongsToMany(
            Consultation::class,
            'consultation_disease'
        );
    }
}
