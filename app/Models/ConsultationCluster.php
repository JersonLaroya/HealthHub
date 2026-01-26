<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationCluster extends Model
{
    protected $fillable = ['consultation_id', 'cluster'];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
