<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Notifications\NewEventPosted;
use App\Notifications\EventUpdated;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['creator', 'editor']);

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        // Date filters
        if ($request->filled('start_date')) {
            $query->whereDate('start_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('end_at', '<=', $request->end_date);
        }

        $query->orderBy('start_at', 'asc');

        $events = $query->paginate(10)->withQueryString();

        return Inertia::render('events/Index', [
            'events' => $events,
            'filters' => [
                'search'     => $request->search,
                'start_date' => $request->start_date,
                'end_date'   => $request->end_date,
            ],
            'breadcrumbs' => [
                ['title' => 'Events', 'href' => '/events'],
            ],
            'currentRole' => strtolower(str_replace(' ', '', auth()->user()->userRole->name)),
        ]);
    }

    public function store(StoreEventRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('events', 'public');
        }

        $event = Event::create([
            ...$validated,
            'created_by' => auth()->id(),
            'edited_by'  => auth()->id(),
        ]);

        // ============================
        // NOTIFY USERS + RCY
        // ============================

        $users = $this->eventAudience();

        foreach ($users as $user) {
            $user->notify(new NewEventPosted($event));
        }

        return back()->with([
            'success' => 'Event created successfully.',
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $validated = $request->validated();

        // If no new image, DO NOT update image column
        if ($request->hasFile('image')) {

            if ($event->image) {
                Storage::disk('public')->delete($event->image);
            }

            $validated['image'] = $request->file('image')->store('events', 'public');
        } else {
            unset($validated['image']); // THIS LINE FIXES IT
        }

        $validated['edited_by'] = auth()->id();

        $event->update($validated);

        // get users + rcy
        $users = $this->eventAudience();

        foreach ($users as $user) {
            $user->notify(new EventUpdated($event));
        }

        return back()->with([
            'success' => 'Event updated successfully.',
        ]);
    }

    public function destroy(Event $event)
    {
        if ($event->image) {
            Storage::disk('public')->delete($event->image);
        }

        $event->delete();

        return back()->with('success', 'Event deleted successfully.');
    }

    private function eventAudience()
    {
        return User::whereHas('userRole', fn ($q) =>
            $q->whereIn('category', ['user', 'rcy'])
        )->get();
    }
}
