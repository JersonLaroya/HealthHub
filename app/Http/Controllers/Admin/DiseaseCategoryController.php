<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DiseaseCategory;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DiseaseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $categories = DiseaseCategory::with('creator')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/DiseaseCategories/Index', [
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
            'name' => 'required|string|unique:disease_categories,name',
        ]);

        DiseaseCategory::create([
            'name' => $request->name,
            'created_by' => Auth::id(),
        ]);

        return back()->with('success', 'Category added successfully.');
    }

    public function update(Request $request, DiseaseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|unique:disease_categories,name,' . $category->id,
        ]);

        $category->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(DiseaseCategory $category)
    {
        $category->delete();

        return back()->with('success', 'Category deleted successfully.');
    }
}
