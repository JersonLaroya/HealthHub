<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bp',
        'rr',
        'pr',
        'temp',
        'o2_sat',
    ];

    /**
     * The patient belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * A patient can have many consultations (or DTRs).
     */
    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    /**
     * Shortcut to get user info (e.g., name, birthdate, sex, etc.).
     */
    public function userInfo()
    {
        return $this->hasOneThrough(
            UserInfo::class,
            User::class,
            'id',          // Foreign key on users table
            'user_id',     // Foreign key on user_infos table
            'user_id',     // Local key on patients table
            'id'           // Local key on users table
        );
    }
}
