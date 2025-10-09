<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FormAssignment;
use Inertia\Inertia;

class MedicalFormController extends Controller
{
    /**
     * Display a list of assigned medical forms for the logged-in user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $assignments = FormAssignment::with('form', 'admin')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('user/medicalForms/Index', [
            'assignments' => $assignments,
            'breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => route('user.dashboard')],
                ['title' => 'Medical Forms'],
            ],
        ]);
    }

    public function show($id, Request $request)
    {
        $assignment = FormAssignment::with('form', 'admin')
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('user/medicalForms/Show', [
            'assignment' => $assignment,
        ]);
    }

    public function submit(Request $request, FormAssignment $assignment)
    {
        $validated = $request->validate([
            'responses' => 'required|array',
        ]);

        // Create or update response
        $assignment->response()->updateOrCreate(
            [],
            ['data' => json_encode($validated['responses'])]
        );

        $assignment->update(['status' => 'submitted', 'submitted_at' => now()]);

        return redirect()->route('user.medical-forms.index')->with('success', 'Form submitted successfully!');
    }
    
}
