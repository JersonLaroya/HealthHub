<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;

class UpdateRcyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow only Admins
        return auth()->check() && auth()->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            'position_id' => [
                'required',
                'exists:user_roles,id',
                Rule::unique('users', 'user_role_id')->ignore($this->route('user')->id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'position_id.unique' => 'This position already has an assigned RCY member.',
        ];
    }
}
