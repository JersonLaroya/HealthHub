<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        $offices = Office::when($request->search, function ($q) use ($request) {
                $search = strtolower($request->search);

                $q->where(function ($qq) use ($search) {
                    $qq->whereRaw('LOWER(name) LIKE ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(code) LIKE ?', ['%' . $search . '%']);
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('superAdmin/Offices/Index', [
            'offices' => $offices,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:offices,name',
            'code' => 'nullable|string|max:20|unique:offices,code',
        ]);

        Office::create([
            'name' => $request->name, 
            'code' => $request->code,
        ]);

        return back()->with('success', 'Office added successfully.');
    }

    public function update(Request $request, Office $office)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:offices,name,' . $office->id,
            'code' => 'nullable|string|max:20|unique:offices,code,' . $office->id,
        ]);

        $office->update([
            'name' => $request->name,
            'code' => $request->code, 
        ]);

        return back()->with('success', 'Office updated successfully.');
    }

    public function destroy(Office $office)
    {
        $office->delete();

        return back()->with('success', 'Office deleted successfully.');
    }
}
