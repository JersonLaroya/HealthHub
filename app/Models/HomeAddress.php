<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeAddress extends Model
{
    use HasFactory;

    protected $fillable = ['purok', 'barangay', 'town', 'province'];

    public function userInfo()
    {
        return $this->hasOne(UserInfo::class, 'home_address_id');
    }
}
