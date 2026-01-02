<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResultType extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function labResults()
    {
        return $this->hasMany(LabResult::class);
    }
}
