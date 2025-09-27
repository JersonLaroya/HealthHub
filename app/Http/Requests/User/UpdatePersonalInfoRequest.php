<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersonalInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check(); // Only authenticated users can update
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:20', 
            'contact_no' => 'nullable|string|max:50',
            'birthdate' => 'nullable|date',
            'sex' => 'nullable|string|max:10',
            'home_address_id' => 'nullable|integer',
            'present_address_id' => 'nullable|integer',
            'guardian_id' => 'nullable|integer',

            // Home address
            'home_purok' => 'nullable|string|max:255',
            'home_barangay' => 'nullable|string|max:255',
            'home_town' => 'nullable|string|max:255',
            'home_province' => 'nullable|string|max:255',

            // Present address
            'present_purok' => 'nullable|string|max:255',
            'present_barangay' => 'nullable|string|max:255',
            'present_town' => 'nullable|string|max:255',
            'present_province' => 'nullable|string|max:255',

            // Guardian
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:50',
        ];
    }
}
