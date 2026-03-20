<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentSlot extends Model
{
    protected $fillable = [
        'appointment_date',
        'start_time',
        'end_time',
        'capacity',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'is_active' => 'boolean',
        'capacity' => 'integer',
    ];

    // protected $attributes = [
    //     'is_active' => true,
    // ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'appointment_slot_id');
    }

    public function bookedAppointments()
    {
        return $this->hasMany(Appointment::class, 'appointment_slot_id')
            ->whereIn('status', ['pending', 'approved']);
    }

    public function bookedCount(): int
    {
        return $this->appointments()
            ->whereIn('status', ['pending', 'approved'])
            ->count();
    }

    public function remainingCapacity(): int
    {
        return max($this->capacity - $this->bookedCount(), 0);
    }

    public function isFull(): bool
    {
        return $this->remainingCapacity() <= 0;
    }
}