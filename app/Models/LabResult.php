<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'laboratory_request_item_id',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function requestItem()
    {
        return $this->belongsTo(LaboratoryRequestItem::class, 'laboratory_request_item_id');
    }

    protected static function booted()
    {
        static::deleting(function ($labResult) {
            foreach ($labResult->images ?? [] as $path) {
                \Storage::disk('public')->delete($path);
            }
        });
    }

}
