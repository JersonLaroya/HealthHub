<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListOfTreatmentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $treatments = Treatment::when($search, function ($q, $search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return inertia('admin/treatments/Index', [
            'treatments' => $treatments,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('list_of_treatments')->where(fn ($q) =>
                    $q->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
                ),
            ],
        ]);

        Treatment::create([
            'name' => $request->name,
        ]);

        return back();
    }

    public function update(Request $request, Treatment $treatment)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('list_of_treatments')
                    ->ignore($treatment->id)
                    ->where(fn ($q) =>
                        $q->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
                    ),
            ],
        ]);

        $treatment->update([
            'name' => $request->name,
        ]);

        return back();
    }

    public function destroy(Treatment $treatment)
    {
        $treatment->delete();
        return back();
    }
}
