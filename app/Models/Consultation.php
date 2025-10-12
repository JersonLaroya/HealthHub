<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'submitted_by',
        'chief_complaint',
        'management_and_treatment',
        'vital_signs',
        'date',
        'time',
        'status',
    ];

    /**
     * A consultation belongs to a patient.
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * A consultation is submitted by a user (admin, nurse, or RCY).
     */
    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
