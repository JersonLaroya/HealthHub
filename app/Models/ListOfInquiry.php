<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ListOfInquiry extends Model
{
    use HasFactory;

    protected $table = 'list_of_inquiries';

    protected $fillable = [
        'name',
    ];

    public function inquiries()
    {
        return $this->belongsToMany(
            Inquiry::class,
            'inquiry_list_of_inquiry'
        )->withTimestamps();
    }
}
