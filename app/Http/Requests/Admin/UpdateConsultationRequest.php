<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConsultationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can update
        return $this->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'time' => 'required',
            'vital_signs' => 'nullable|string|max:255',
            'chief_complaint' => 'required|string|max:255',
            'management_and_treatment' => 'required|string|max:255',
        ];
    }
}
