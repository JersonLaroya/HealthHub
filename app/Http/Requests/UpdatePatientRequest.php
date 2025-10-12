<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow only authorized users (adjust as needed)
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'blood_type' => 'required|string|max:5',
            'bp' => 'required|string|max:20',
            'rr' => 'required|string|max:20',
            'pr' => 'required|string|max:20',
            'temp' => 'required|string|max:10',
            'o2_sat' => 'required|string|max:10',
        ];
    }
}
