<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaboratoryRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'record_id',
        'laboratory_type_id',
    ];

    public function record()
    {
        return $this->belongsTo(Record::class);
    }

    public function laboratoryType()
    {
        return $this->belongsTo(LaboratoryType::class);
    }

    public function result()
    {
        return $this->hasOne(LabResult::class);
    }
}