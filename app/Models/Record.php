<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Record extends Model
{
    use HasFactory;

    const STATUS_MISSING = 'missing';
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    public function scopeApproved($query)
    {
        return $query->where('records.status', self::STATUS_APPROVED);
    }

    public function scopePending($query)
    {
        return $query->where('records.status', self::STATUS_PENDING);
    }

    protected $fillable = [
        'user_id',
        'consultation_id',
        'service_id',
        'lab_result_id',
        'response_data',
        'status',
    ];

    protected $casts = [
        'response_data' => 'array',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function laboratoryRequestItems()
    {
        return $this->hasMany(LaboratoryRequestItem::class);
    }

    public function labResult()
    {
        return $this->belongsTo(LabResult::class);
    }
    
}
