<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        // $this->route('position') will give the current UserRole model
        $positionId = $this->route('position')->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('user_roles')->where(function ($query) {
                    $query->where('category', 'rcy');
                })->ignore($positionId),
            ],
        ];
    }

    public function prepareForValidation()
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => strtoupper(trim($this->name)),
            ]);
        }
    }
}
