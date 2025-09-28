<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDtrRequest extends FormRequest
{
    public function authorize()
    {
        $user = $this->user(); // currently logged-in user

        return in_array($user->userRole->name, ['Admin', 'Head Nurse', 'Nurse']);
    }

    public function rules()
    {
        return [
            'dtr_date'       => 'required|date',
            'dtr_time'       => 'required',
            'purpose'    => 'required|string|max:255',
            'management' => 'required|string|max:255',

            // optional: you could also validate auto-filled patient info if you want
            'name'       => 'required|string|max:255',
            'sex'        => 'required|string|max:10',
            'age'        => 'required|integer',
            'course_year_office' => 'required|string|max:255',
        ];
    }
}
