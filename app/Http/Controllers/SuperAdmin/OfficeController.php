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

                $q->whereRaw('LOWER(name) LIKE ?', ['%' . $search . '%']);
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
        ]);

        Office::create([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Office added successfully.');
    }

    public function update(Request $request, Office $office)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:offices,name,' . $office->id,
        ]);

        $office->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Office updated successfully.');
    }

    public function destroy(Office $office)
    {
        $office->delete();

        return back()->with('success', 'Office deleted successfully.');
    }
}
