<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YearLevel extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code'];

    // Users belonging to this year level
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
