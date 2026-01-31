<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $casts = [
        'is_seen' => 'boolean',
        'file_size' => 'integer',
    ];

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'conversation_key',
        'body',

        // images
        'image_path',
        'image_batch_id',

        // files
        'file_path',
        'file_name',
        'file_size',

        'is_seen',
    ];

    protected static function booted()
    {
        static::creating(function ($message) {
            $a = $message->sender_id;
            $b = $message->receiver_id;

            $message->conversation_key = $a < $b ? "{$a}_{$b}" : "{$b}_{$a}";
        });
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function conversation()
    {
        return $this->hasMany(
            Message::class,
            'conversation_key',
            'conversation_key'
        );
    }

}
