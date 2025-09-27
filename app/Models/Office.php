<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function office()
    {
        return $this->hasMany(User::class, 'office_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

}
