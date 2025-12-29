<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePositionRequest extends FormRequest
{
    public function authorize()
    {
        return true; // adjust if needed
    }

    public function rules()
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                // Unique in user_roles for category 'rcy'
                Rule::unique('user_roles')->where(function ($query) {
                    $query->where('category', 'rcy');
                }),
            ],
        ];
    }

    public function prepareForValidation()
    {
        // Trim and uppercase to avoid case-sensitive duplicates
        if ($this->has('name')) {
            $this->merge([
                'name' => strtoupper(trim($this->name)),
            ]);
        }
    }
}
