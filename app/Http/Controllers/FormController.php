<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FormController extends Controller
{
    public function index()
    {
        $forms = Form::latest()->paginate(10);
        return inertia('admin/forms/Index', ['forms' => $forms]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $path = $file->store('forms', 'public'); // stored in storage/app/public/forms

        Form::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'description' => $request->description,
            'file_path' => $path,
        ]);

        return redirect()->back()->with('success', 'Form created successfully!');
    }

    public function update(Request $request, Form $form)
    {
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|mimes:pdf|max:20480',
        ]);

        if ($request->hasFile('file')) {
            if ($form->file_path && file_exists(public_path('storage/' . $form->file_path))) {
                unlink(public_path('storage/' . $form->file_path));
            }
            $validated['file_path'] = $request->file('file')->store('forms', 'public');
        }

        $form->update($validated);

        return back()->with('success', 'Form updated successfully.');
    }

    public function destroy(Form $form)
    {
        if ($form->file_path && \Storage::disk('public')->exists($form->file_path)) {
            \Storage::disk('public')->delete($form->file_path);
        }

        $form->delete();

        return redirect()->back()->with('success', 'Form deleted successfully.');
    }
}
