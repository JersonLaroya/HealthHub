<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Disease;
use App\Models\DiseaseCategory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ListOfDiseaseController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $diseases = Disease::with('category')
            ->when($search, function ($query, $search) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
            })
            ->orderBy($sort, $direction)
            ->paginate(10)
            ->withQueryString();

        $categories = DiseaseCategory::orderBy('name')->get();

        return inertia('admin/ListOfDiseases/Index', [
            'diseases' => $diseases,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('list_of_diseases')->where(function ($q) use ($request) {
                    return $q->where('disease_category_id', $request->disease_category_id)
                            ->whereRaw('LOWER(name) = ?', [strtolower($request->name)]);
                }),
            ],
            'disease_category_id' => 'required|exists:disease_categories,id',
        ]);

        Disease::create([
            'name' => $request->name,
            'disease_category_id' => $request->disease_category_id,
        ]);

        return back()->with('success', 'Disease added successfully.');
    }

    public function update(Request $request, Disease $disease)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('list_of_diseases')
                    ->ignore($disease->id)
                    ->where(function ($q) use ($request) {
                        return $q->where('disease_category_id', $request->disease_category_id)
                                ->whereRaw('LOWER(name) = ?', [strtolower($request->name)]);
                    }),
            ],
            'disease_category_id' => 'required|exists:disease_categories,id',
        ]);

        $disease->update([
            'name' => $request->name,
            'disease_category_id' => $request->disease_category_id,
        ]);

        return back()->with('success', 'Disease updated successfully.');
    }

    public function destroy(Disease $disease)
    {
        $disease->delete();
        return back()->with('success', 'Disease deleted successfully.');
    }
}
