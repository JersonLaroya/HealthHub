<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'assigned_to',
        'appointment_date',
        'start_time',
        'end_time',
        'purpose',
        'status',
        'notes',
        'rejection_reason',
    ];

    /* Relationships */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
