<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PresentAddress extends Model
{
    use HasFactory;

    protected $fillable = ['purok', 'barangay', 'town', 'province'];

    public function userInfo()
    {
        return $this->hasOne(UserInfo::class, 'present_address_id');
    }
}
