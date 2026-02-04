<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index()
    {
        $forms = Service::latest()->paginate(10);
        return inertia('admin/forms/Index', ['forms' => $forms]);
    }

    // public function store(Request $request)
    // {
    //     $request->validate([
    //         'title' => 'required|string|max:255',
    //         'description' => 'nullable|string',
    //         'file' => 'required|file|mimes:pdf|max:10240',
    //     ]);

    //     $path = $request->file('file')->store('forms', 'public');

    //     Service::create([
    //         'title' => $request->title,
    //         'slug' => Str::slug($request->title),
    //         'description' => $request->description,
    //         'file_path' => $path,
    //     ]);

    //     return redirect()->back()->with('success', 'Form created successfully!');
    // }

    public function update(Request $request, Service $form)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|mimes:pdf|max:20480',
        ]);

        if ($request->hasFile('file')) {
            // delete old file from public storage
            if ($form->file_path && Storage::disk('public')->exists($form->file_path)) {
                Storage::disk('public')->delete($form->file_path);
            }

            // store new file
            $validated['file_path'] = $request->file('file')->store('forms', 'public');
        }

        $form->update($validated);

        return back()->with('success', 'Form updated successfully.');
    }

    // public function destroy(Service $form)
    // {
    //     if ($form->file_path && Storage::disk('public')->exists($form->file_path)) {
    //         Storage::disk('public')->delete($form->file_path);
    //     }

    //     $form->delete();

    //     return redirect()->back()->with('success', 'Form deleted successfully.');
    // }
}
