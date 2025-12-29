<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\UserRole;

class StoreRcyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow only Admins
        return auth()->check() && auth()->user()->userRole->name === 'Admin';
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'position_id' => [
                'required',
                // Must exist in user_roles with category 'rcy'
                Rule::exists('user_roles', 'id')->where(fn($q) => $q->where('category', 'rcy')),
                // Ensure no other user has this position
                function ($attribute, $value, $fail) {
                    $exists = \App\Models\User::where('user_role_id', $value)->exists();
                    if ($exists) {
                        $fail('This position already has an assigned RCY member.');
                    }
                }
            ],
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('position_id')) {
            $this->merge([
                'position_id' => intval($this->position_id),
            ]);
        }
    }
}
