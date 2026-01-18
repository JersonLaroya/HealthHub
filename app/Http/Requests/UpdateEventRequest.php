<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user(); // currently logged-in user

        return in_array($user->userRole->name, ['Admin', 'Head Nurse', 'Nurse']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'start_at'    => 'sometimes|required|date',
            'end_at'      => 'sometimes|nullable|date|after_or_equal:start_at',
            'image'       => 'sometimes|nullable|image|max:2048',
        ];
    }
}
