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

            'bp' => 'nullable|string|max:20',
            'rr' => 'nullable|string|max:20',
            'pr' => 'nullable|string|max:20',
            'temp' => 'nullable|string|max:10',
            'o2_sat' => 'nullable|string|max:10',

            'medical_complaint' => 'required|string|max:255',
            'disease_id' => 'nullable|exists:list_of_diseases,id',
            'management_and_treatment' => 'required|string|max:255',
        ];
    }

}
