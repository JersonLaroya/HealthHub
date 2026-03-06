<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'app_name',
        'app_logo',
        'clinic_logo',
        'school_year',
        'clinic_accomplishments',
        'homepage_services',
        'healthcare_professionals',
        'healthhub_tour',
        'footer_content',
    ];

    protected $casts = [
        'clinic_accomplishments' => 'array',
        'homepage_services' => 'array',
        'healthcare_professionals' => 'array',
        'healthhub_tour' => 'array',
        'footer_content' => 'array',
    ];
}