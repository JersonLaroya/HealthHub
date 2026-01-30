<?php

namespace App\Models;

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

        // profile fields
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'sex',
        'birthdate',
        'contact_no',
        'guardian_name',
        'guardian_contact_no',
        'signature',
        'ismis_id',

        // address FKs
        'home_address_id',
        'present_address_id',

        // auth / role related
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
        'birthdate' => 'date',
    ];

    protected $appends = ['name'];

    /* ======================
       Accessors
    ====================== */

    public function getNameAttribute(): string
    {
        return trim(
            collect([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
                $this->suffix,
            ])->filter()->join(' ')
        );
    }

    /* ======================
       Relationships
    ====================== */

    public function userRole()
    {
        return $this->belongsTo(UserRole::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function yearLevel()
    {
        return $this->belongsTo(YearLevel::class);
    }

    public function vitalSign()
    {
        return $this->hasOne(VitalSign::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class, 'user_id');
    }

    // inquiries made for this patient
    public function inquiries()
    {
        return $this->hasMany(Inquiry::class);
    }

    // inquiries created by staff
    public function createdInquiries()
    {
        return $this->hasMany(Inquiry::class, 'created_by');
    }

    // inquiries updated by staff
    public function updatedInquiries()
    {
        return $this->hasMany(Inquiry::class, 'updated_by');
    }


    public function homeAddress()
    {
        return $this->belongsTo(Address::class, 'home_address_id');
    }

    public function presentAddress()
    {
        return $this->belongsTo(Address::class, 'present_address_id');
    }

    public function dtrs()
    {
        return $this->hasMany(Dtr::class);
    }

    public function rcyMember()
    {
        return $this->hasOne(RcyMember::class);
    }
}
