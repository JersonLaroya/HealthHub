<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
{
    $query = Event::with(['creator.userInfo', 'editor.userInfo']);

    // Search
    if ($request->filled('search')) {
        $query->where('title', 'like', "%{$request->search}%")
              ->orWhere('description', 'like', "%{$request->search}%");
    }

    // Date filters
    if ($request->filled('start_date')) {
        $query->whereDate('start_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('end_at', '<=', $request->end_date);
    }

    // Sorting
    $sort = $request->get('sort', 'start_at');
    $direction = $request->get('direction', 'asc');
    $query->orderBy($sort, $direction);

    // Pagination with timestamps included
    $events = $query->paginate(10)->withQueryString();

    return Inertia::render('events/Index', [
        'events'   => $events,
        'filters'  => array_merge([
            'search' => null, 
            'sort', 
            'direction', 
            'start_date', 
            'end_date'
        ]),
        'breadcrumbs' => [
            ['title' => 'Events', 'href' => '/events'],
        ],
        'currentRole' => strtolower(str_replace(' ', '', auth()->user()->userRole->name)), // e.g. "admin", "headnurse", "nurse"
    ]);

    // 'filters' => array_merge([
    //         'search' => null,
    //         'role' => null,
    //         'sort' => 'last_name',
    //         'direction' => 'asc',
    //     ], $request->only('search', 'role', 'sort', 'direction')),

}


    public function store(StoreEventRequest $request)
    {
        $validated = $request->validated();

        Event::create([
            ...$validated,
            'created_by' => auth()->id(),
            'edited_by'  => auth()->id(), 
        ]);

        return redirect()->back()->with('success', 'Event created successfully.');
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $validated = $request->validated();

        $event->update($validated);

        return redirect()->back()->with('success', 'Event updated successfully.');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->back()->with('success', 'Event deleted successfully.');
    }
}
