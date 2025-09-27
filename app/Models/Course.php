<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Course extends Model
{
    use HasFactory;

    protected $fillable = ['office_id', 'name', 'code'];

    public function office()
    {
        return $this->belongsTo(Office::class);
    }
}

