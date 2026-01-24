<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->search ? Str::lower($request->search) : null;

        $courses = Course::with('office')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(code) LIKE ?', ["%{$search}%"]);
                });
            })
            ->when($request->office_id, function ($q) use ($request) {
                $q->where('office_id', $request->office_id);
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('superAdmin/Courses/Index', [
            'courses' => $courses,
            'offices' => Office::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('search', 'office_id'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'office_id' => 'required|exists:offices,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
        ]);

        Course::create($request->only('office_id', 'name', 'code'));

        return back()->with('success', 'Course added successfully');
    }

    public function update(Request $request, Course $course)
    {
        $request->validate([
            'office_id' => 'required|exists:offices,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
        ]);

        $course->update($request->only('office_id', 'name', 'code'));

        return back()->with('success', 'Course updated successfully');
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return back()->with('success', 'Course deleted successfully');
    }
}
