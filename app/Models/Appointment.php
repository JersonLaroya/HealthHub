<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'approved_by',
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

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
