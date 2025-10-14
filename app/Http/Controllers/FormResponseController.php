<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\Request;

class FormResponseController extends Controller
{
    public function show($formId, $patientId)
    {
        $form = Form::findOrFail($formId);

        $response = FormResponse::where('form_id', $formId)
            ->where('patient_id', $patientId)
            ->first();

        return inertia('forms/ShowResponse', [
            'form' => $form,
            'response' => $response,
        ]);
    }
}
