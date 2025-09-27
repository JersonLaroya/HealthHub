<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only allow admins
        return auth()->check() && auth()->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            'first_name'   => ['required', 'string', 'max:100'],      // will be saved in user_infos
            'middle_name'  => ['nullable', 'string', 'max:100'],      // user_infos
            'last_name'    => ['required', 'string', 'max:100'],      // user_infos
            'email'        => ['required', 'email', 'unique:users,email'], // still in users
            'user_role_id' => ['required', 'exists:user_roles,id'],    // still in users
        ];
    }
}
