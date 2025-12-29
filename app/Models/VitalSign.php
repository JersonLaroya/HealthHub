<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model
{
    use HasFactory;

    protected $table = 'vital_signs';

    protected $fillable = [
        'user_id',
        'bp',
        'rr',
        'pr',
        'temp',
        'o2_sat',
        'blood_type',
    ];

    /**
     * Vital signs belong to a user (the patient).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * A vital sign record can be linked to consultations.
     * (Keep only if consultations are per vital-sign record)
     */
    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }
}
