<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RcyPosition extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function members()
    {
        return $this->hasMany(RcyMember::class, 'position_id');
    }
}
