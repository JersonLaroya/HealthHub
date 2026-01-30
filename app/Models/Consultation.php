<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'created_by',
        'updated_by',
        'medical_complaint',
        'management_and_treatment',
        'vital_signs_id',
        'date',
        'time',
        'status',
    ];

    /* ======================
       Relationships
    ====================== */

    // Patient (now User)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Admin / Nurse / RCY who created it
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function diseases()
    {
        return $this->belongsToMany(
            Disease::class,
            'consultation_disease'
        );
    }

    public function treatments()
    {
        return $this->belongsToMany(
            \App\Models\Treatment::class,
            'consultation_treatment'
        );
    }


    // Vital signs snapshot
    public function vitalSigns()
    {
        return $this->belongsTo(VitalSign::class, 'vital_signs_id');
    }

    protected static function booted()
    {
        static::deleting(function ($consultation) {
            // Delete associated vital signs
            if ($consultation->vitalSigns) {
                $consultation->vitalSigns->delete();
            }
        });
    }

    public function cluster()
    {
        return $this->hasOne(\App\Models\ConsultationCluster::class);
    }

}
