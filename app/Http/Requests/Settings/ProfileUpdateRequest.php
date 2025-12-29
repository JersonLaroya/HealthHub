<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    $rules = [
        'first_name'     => ['required', 'string', 'max:255'],
        'middle_name'    => ['nullable', 'string', 'max:255'],
        'last_name'      => ['required', 'string', 'max:255'],
        'email'          => [
            'required',
            'string',
            'lowercase',
            'email',
            'max:255',
            Rule::unique(User::class)->ignore($this->user()->id),
        ],
        'office_id'      => ['nullable', 'integer', 'exists:offices,id'],
        'user_role_id'   => ['nullable', 'integer', 'exists:user_roles,id'],
        'course_id'      => ['nullable', 'integer', 'exists:courses,id'],
        'year_level_id'  => ['nullable', 'integer', 'exists:year_levels,id'],
    ];

    if (in_array($this->user()->userRole?->name, ['Student', 'Staff', 'Faculty'])) {
        $rules['user_role_id'] = ['required', 'exists:user_roles,id'];
    }

    return $rules;
}

public function messages(): array
{
    return [
        'first_name.required' => 'Please enter your first name.',
        'last_name.required'  => 'Please enter your last name.',
    ];
}


}
