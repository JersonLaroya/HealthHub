<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'created_by',
        'updated_by',
        'description',
        'response',
        'status',
    ];

    // patient
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // staff who created
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // staff who last updated
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // inquiry types (many-to-many)
    public function inquiryTypes()
    {
        return $this->belongsToMany(
            ListOfInquiry::class,
            'inquiry_list_of_inquiry'
        )->withTimestamps();
    }
}
