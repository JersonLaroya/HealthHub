<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $fillable = [
        'barangay_id',
        'purok',
    ];

    public $timestamps = false;

    public function homeUser()
    {
        return $this->hasOne(User::class, 'home_address_id');
    }

    public function presentUser()
    {
        return $this->hasOne(User::class, 'present_address_id');
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function getFullAddressAttribute()
    {
        return "{$this->street}, {$this->barangay->name}, {$this->barangay->municipality->name}, {$this->barangay->municipality->province->name}";
    }

}
