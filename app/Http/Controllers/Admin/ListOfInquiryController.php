<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ListOfInquiry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListOfInquiryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $inquiries = ListOfInquiry::when($search, function ($query, $search) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
            })
            ->orderBy($sort, $direction)
            ->paginate(10)
            ->withQueryString();

        return inertia('admin/inquiries/Index', [
            'inquiries' => $inquiries,
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
                Rule::unique('list_of_inquiries')->where(function ($query) use ($request) {
                    $query->whereRaw('LOWER(name) = ?', [strtolower($request->name)]);
                }),
            ],
        ]);

        ListOfInquiry::create([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Inquiry added successfully.');
    }

    public function update(Request $request, ListOfInquiry $listOfInquiry)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('list_of_inquiries')
                    ->ignore($listOfInquiry->id)
                    ->where(function ($query) use ($request) {
                        $query->whereRaw('LOWER(name) = ?', [strtolower($request->name)]);
                    }),
            ],
        ]);

        $listOfInquiry->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Inquiry updated successfully.');
    }

    public function destroy(ListOfInquiry $listOfInquiry)
    {
        $listOfInquiry->delete();
        return back()->with('success', 'Inquiry deleted successfully.');
    }
}
