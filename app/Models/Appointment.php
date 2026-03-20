<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'appointment_slot_id',
        'approved_by',
        'purpose',
        'status',
        'completed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'purpose' => 'encrypted',
            'rejection_reason' => 'encrypted',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function slot()
    {
        return $this->belongsTo(AppointmentSlot::class, 'appointment_slot_id');
    }
}