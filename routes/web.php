<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Admin\PersonnelController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\User\PersonalInfoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
 
Route::middleware('web')->group(function () {
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
});

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


Route::middleware(['role:Student,Faculty,Staff'])->prefix('user')->name('user.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('user/dashboard');
    })->name('dashboard');

    // Personal Information page (view & update)
    Route::get('/personal-info', [PersonalInfoController::class, 'edit'])->name('personal-info.edit');
    Route::put('/personal-info', [PersonalInfoController::class, 'update'])->name('personal-info.update');

    Route::get('/medical-forms', function () {
        return Inertia::render('user/medical-forms');
    })->name('medical-forms');
    Route::get('/records', function () {
        return Inertia::render('user/records');
    })->name('records');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
});


Route::middleware(['role:Admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('admin/dashboard');
        })->name('dashboard');

        Route::get('/dtr', fn() => Inertia::render('admin/dtr'))->name('dtr');
        Route::get('/events', fn() => Inertia::render('admin/events'))->name('events');
        Route::get('/files', fn() => Inertia::render('admin/files'))->name('files');
        Route::get('/forms', fn() => Inertia::render('admin/forms'))->name('forms');
        Route::get('/patients', fn() => Inertia::render('admin/patients'))->name('patients');
        Route::get('/reports', fn() => Inertia::render('admin/reports'))->name('reports');

        Route::resource('personnels', PersonnelController::class);
        Route::post('/personnels', [PersonnelController::class, 'store'])->name('admin.personnels.store');
        Route::put('/personnels/{personnel}', [PersonnelController::class, 'update'])->name('admin.personnels.update');
        Route::delete('/personnels/{personnel}', [PersonnelController::class, 'destroy'])->name('admin.personnels.destroy');

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
});

Route::middleware(['role:Nurse'])->prefix('nurse')->name('nurse.')->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('admin/dashboard'))->name('dashboard');
    Route::get('/dtr', fn() => Inertia::render('admin/dtr'))->name('dtr');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
});


//For Events
Route::middleware(['auth'])->group(function () {
    // Admin
    Route::prefix('admin')->middleware('role:Admin')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('admin.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('admin.events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('admin.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('admin.events.destroy');
    });

    // Head Nurse
    Route::prefix('headnurse')->middleware('role:Head Nurse')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('headnurse.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('headnurse.events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('headnurse.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('headnurse.events.destroy');
    });

    // Nurse
    Route::prefix('nurse')->middleware('role:Nurse')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('nurse.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('nurse.events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('nurse.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('nurse.events.destroy');
    });
});


Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
