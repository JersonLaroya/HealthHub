<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LaboratoryType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaboratoryTypeController extends Controller
{

    public function index()
    {
        return Inertia::render('admin/laboratoryTypes/Index', [
            'labTypes' => LaboratoryType::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:laboratory_types,name',
        ]);

        LaboratoryType::create([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Laboratory type added successfully.');
    }

    public function update(Request $request, LaboratoryType $laboratoryType)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:laboratory_types,name,' . $laboratoryType->id,
        ]);

        $laboratoryType->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Laboratory type updated.');
    }

    public function destroy(LaboratoryType $laboratoryType)
    {
        $laboratoryType->delete();

        return back()->with('success', 'Laboratory type deleted.');
    }
}
