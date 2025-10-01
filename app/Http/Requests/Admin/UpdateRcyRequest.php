<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
                'exists:rcy_positions,id',
                Rule::unique('rcy_members', 'position_id')->ignore($this->rcy),
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
