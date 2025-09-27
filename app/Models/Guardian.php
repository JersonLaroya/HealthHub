<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'contact_no'];

    public function userInfo()
    {
        return $this->hasOne(UserInfo::class);
    }
}
