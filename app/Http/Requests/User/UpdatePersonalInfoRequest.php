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
            'contact_no' => ['required', 'regex:/^(?:\+63|0)9\d{9}$/'],
            'birthdate' => 'required|date',
            'sex' => 'required|string|max:10',
            'signature' => 'required|string',

            // Home Address
            'home_province_name' => 'required|string|max:255',
            'home_province_code' => 'required|string|max:20',
            'home_municipality_name' => 'required|string|max:255',
            'home_municipality_code' => 'required|string|max:20',
            'home_barangay_name' => 'required|string|max:255',
            'home_barangay_code' => 'required|string|max:20',
            'home_purok' => 'required|string|max:255',

            // Present Address
            'present_province_name' => 'required|string|max:255',
            'present_province_code' => 'required|string|max:20',
            'present_municipality_name' => 'required|string|max:255',
            'present_municipality_code' => 'required|string|max:20',
            'present_barangay_name' => 'required|string|max:255',
            'present_barangay_code' => 'required|string|max:20',
            'present_purok' => 'required|string|max:255',

            // Guardian
            'guardian_name' => 'required|string|max:255',
            'guardian_contact_no' => ['required', 'regex:/^(?:\+63|0)9\d{9}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'contact_no.regex' => 'Contact number must be a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).',
            'guardian_contact_no.regex' => 'Guardian contact number must be a valid Philippine mobile number.',
        ];
    }


}
