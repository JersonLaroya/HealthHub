<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FormAssignment;
use Inertia\Inertia;

class MedicalFormController extends Controller
{
    /**
     * Display a paginated list of medical forms assigned to the logged-in patient.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient; // may be null if not a patient

        if (!$patient) {
            abort(403, 'You do not have access to medical forms.');
        }

        $assignments = FormAssignment::with(['form', 'admin'])
            ->where('patient_id', $patient->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('user/medicalForms/Index', [
            'assignments' => $assignments,
            'breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => route('user.dashboard')],
                ['title' => 'Medical Forms'],
            ],
        ]);
    }

    /**
     * Display a specific assigned medical form.
     */
    public function show($id, Request $request)
    {
        $patientId = optional($request->user()->patient)->id;

        if (!$patientId) {
            abort(403, 'You do not have access to medical forms.');
        }

        $assignment = FormAssignment::with(['form', 'admin'])
            ->where('patient_id', $patientId)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('user/medicalForms/Show', [
            'assignment' => $assignment,
            'fileUrl' => $assignment->form->file_path 
                ? asset('storage/' . $assignment->form->file_path) 
                : null,
        ]);
    }

    /**
     * Submit a completed medical form.
     */
    public function submit(Request $request, FormAssignment $assignment)
    {
        $patient = $request->user()->patient;

        if (!$patient || $assignment->patient_id !== $patient->id) {
            abort(403, 'Unauthorized to submit this form.');
        }

        $validated = $request->validate([
            'responses' => 'required|array',
        ]);

        $assignment->response()->updateOrCreate(
            [],
            ['data' => json_encode($validated['responses'])]
        );

        $assignment->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return redirect()
            ->route('user.medical-forms.index')
            ->with('success', 'Form submitted successfully!');
    }
}
