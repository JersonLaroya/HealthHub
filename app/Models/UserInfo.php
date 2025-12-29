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
        'suffix',
        'signature',
        'contact_no',
        'birthdate',
        'sex',
        'home_address_id',
        'present_address_id',
        'guardian_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function homeAddress()
    {
        return $this->belongsTo(HomeAddress::class, 'home_address_id');
    }

    public function presentAddress()
    {
        return $this->belongsTo(PresentAddress::class, 'present_address_id');
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class, 'guardian_id');
    }
}
