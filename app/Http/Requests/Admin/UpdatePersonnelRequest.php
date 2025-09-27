<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only admins can update personnel
        return auth()->check() && auth()->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            // ✅ Fields stored in user_infos table
            'first_name'   => ['required', 'string', 'max:100'],
            'middle_name'  => ['nullable', 'string', 'max:100'],
            'last_name'    => ['required', 'string', 'max:100'],

            // ✅ Fields stored in users table
            'email'        => ['required', 'email', 'unique:users,email,' . $this->personnel->id],
            'user_role_id' => ['required', 'exists:user_roles,id'],
        ];
    }
}
