<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserInfo extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'contact_no',
        'birthday',
        'sex',
        'home_address_id',
        'present_address_id',
        'guardian_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
