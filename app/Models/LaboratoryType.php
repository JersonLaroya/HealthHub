<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaboratoryType extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function requestItems()
    {
        return $this->hasMany(LaboratoryRequestItem::class);
    }
}
