<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRcyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow only Admins (or extend later if nurses/head nurse can also add)
        return auth()->check() && auth()->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'position_id' => ['required', 'exists:rcy_positions,id', 'unique:rcy_members,position_id'],
        ];
    }

    public function messages(): array
    {
        return [
            'position_id.unique' => 'This position already has an assigned RCY member.',
        ];
    }

}
