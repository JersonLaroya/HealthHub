<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public $timestamps = true;

    protected $fillable = [
        'email',
        'password',
        'google_id',
        'google_token',
        'google_refresh_token',
        'user_role_id',
        'office_id',
        'course_id',
        'year_level_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = ['name'];

    public function getNameAttribute(): string
    {
        // Prefer user_info relation
        if ($this->userInfo) {
            return trim(
                collect([
                    $this->userInfo->first_name,
                    $this->userInfo->middle_name,
                    $this->userInfo->last_name
                ])->filter()->join(' ')
            );
        }

        // Fallback if no user_info yet
        return $this->email;
    }

    public function userRole()
    {
        return $this->belongsTo(UserRole::class, 'user_role_id');
    }

    public function office()
    {
        return $this->belongsTo(Office::class, 'office_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function yearLevel()
    {
        return $this->belongsTo(YearLevel::class);
    }

    public function userInfo()
    {
        return $this->hasOne(UserInfo::class);
    }

    public function dtrs()
    {
        return $this->hasMany(Dtr::class);
    }

}
