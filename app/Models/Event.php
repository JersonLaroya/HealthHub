<?php

// app/Models/Event.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_at',
        'end_at',
        'created_by',
        'edited_by',
        'image',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'edited_by');
    }

    protected static function booted()
    {
        // Automatically set created_by when creating
        static::creating(function ($event) {
            if (Auth::check()) {
                $event->created_by = Auth::id();
            }
        });

        // Automatically set edited_by when updating
        static::updating(function ($event) {
            if (Auth::check()) {
                $event->edited_by = Auth::id();
            }
        });
    }
}
