<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_id',
        'user_id',
        'assigned_by',
        'status',
        'submitted_at',
        'due_date',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function response()
    {
        return $this->hasOne(FormResponse::class);
    }
}
