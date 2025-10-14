<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DtrController;
use App\Http\Controllers\Admin\RcyMemberController;
use App\Http\Controllers\FormAssignmentController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\FormResponseController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientPdfController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Admin\PersonnelController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\User\MedicalFormController;
use App\Http\Controllers\User\PersonalInfoController;
use App\Http\Controllers\User\RcyController;
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


// Routes for Student, Faculty, and Staff
Route::middleware(['role:Student,Faculty,Staff'])->prefix('user')->name('user.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('user/dashboard');
    })->name('dashboard');

    // Personal Information page (view & update)
    Route::get('/personal-info', [PersonalInfoController::class, 'edit'])->name('personal-info.edit');
    Route::put('/personal-info', [PersonalInfoController::class, 'update'])->name('personal-info.update');

    // Medical Forms page
    Route::get('/medical-forms', [MedicalFormController::class, 'index'])->name('medical-forms.index');
    Route::get('/medical-forms/{id}', [MedicalFormController::class, 'show'])->name('medical-forms.show');
    Route::post('/medical-forms/{assignment}/submit', [MedicalFormController::class, 'submit'])->name('medical-forms.submit');

    Route::get('/records', function () {
        return Inertia::render('user/records');
    })->name('records');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
});

// Routes for Admin
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
        Route::get('/reports', fn() => Inertia::render('admin/reports'))->name('reports');

        Route::resource('personnels', PersonnelController::class);
        Route::post('/personnels', [PersonnelController::class, 'store'])->name('admin.personnels.store');
        Route::put('/personnels/{personnel}', [PersonnelController::class, 'update'])->name('admin.personnels.update');
        Route::delete('/personnels/{personnel}', [PersonnelController::class, 'destroy'])->name('admin.personnels.destroy');

        Route::get('/rcy', [RcyMemberController::class, 'index'])->name('rcy.index');
        Route::post('/rcy', [RcyMemberController::class, 'store'])->name('rcy.store');
        Route::put('/rcy/{rcyMember}', [RcyMemberController::class, 'update'])->name('rcy.update');
        Route::delete('/rcy/{rcyMember}', [RcyMemberController::class, 'destroy'])->name('rcy.destroy');
        Route::get('rcy/search-students', [RcyMemberController::class, 'searchStudents']);


        Route::get('/forms', [FormController::class, 'index'])->name('admin.forms.index');
        Route::post('/forms', [FormController::class, 'store'])->name('admin.forms.store');
        Route::put('/forms/{form}', [FormController::class, 'update'])->name('admin.forms.update');
        Route::delete('/forms/{form}', [FormController::class, 'destroy'])->name('admin.forms.destroy');

        Route::get('/form-assignments', [FormAssignmentController::class, 'index'])->name('form-assignments.index');
        Route::get('/form-assignments/create', [FormAssignmentController::class, 'create'])->name('form-assignments.create');
        Route::post('/form-assignments', [FormAssignmentController::class, 'store'])->name('form-assignments.store');
        Route::get('/form-assignments/search-users', [FormAssignmentController::class, 'searchUsers'])->name('form-assignments.search-users');
        Route::get('/form-assignments/auto-select-users', [FormAssignmentController::class, 'autoSelectUsers'])->name('form-assignments.auto-select-users');

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

//For DTR
Route::middleware(['auth'])->group(function () {
    // Admin
    Route::prefix('admin')->middleware('role:Admin')->group(function () {
        Route::get('/dtr', [DtrController::class, 'index'])->name('admin.dtr.index');
        Route::post('/dtr', [DtrController::class, 'store'])->name('admin.dtr.store');
        Route::put('/dtr/{dtr}', [DtrController::class, 'update'])->name('admin.dtr.update');
        Route::delete('/dtr/{dtr}', [DtrController::class, 'destroy'])->name('admin.dtr.destroy');
        Route::get('/patients/search', [DtrController::class, 'searchPatients'])->name('patients.search');
    });

    // Head Nurse
    Route::prefix('headnurse')->middleware('role:Head Nurse')->group(function () {
        Route::get('/dtr', [DtrController::class, 'index'])->name('headnurse.dtr.index');
        Route::post('/dtr', [DtrController::class, 'store'])->name('headnurse.dtr.store');
        Route::put('/dtr/{dtr}', [DtrController::class, 'update'])->name('headnurse.dtr.update');
        Route::delete('/dtr/{dtr}', [DtrController::class, 'destroy'])->name('headnurse.dtr.destroy');
        Route::get('/patients/search', [DtrController::class, 'searchPatients'])->name('patients.search');
    });

    // Nurse
    Route::prefix('nurse')->middleware('role:Nurse')->group(function () {
        Route::get('/dtr', [DtrController::class, 'index'])->name('nurse.dtr.index');
        Route::post('/dtr', [DtrController::class, 'store'])->name('nurse.dtr.store');
        Route::put('/dtr/{dtr}', [DtrController::class, 'update'])->name('nurse.dtr.update');
        Route::delete('/dtr/{dtr}', [DtrController::class, 'destroy'])->name('nurse.dtr.destroy');
        Route::get('/patients/search', [DtrController::class, 'searchPatients'])->name('patients.search');
    });

    // RCY
    Route::prefix('user')->middleware('role:Student')->group(function () {
            Route::get('/rcy', [RcyController::class, 'create'])->name('rcy.add');
            Route::post('/rcy', [RcyController::class, 'store'])->name('rcy.store');
            Route::get('/patients/search', [RcyController::class, 'searchPatients'])->name('patients.search');
    });
});

//For Patients
Route::middleware(['auth'])->group(function () {
    // Admin
    Route::prefix('admin')->middleware('role:Admin')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('admin.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('admin.patients.show');
        Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('admin.patients.update');
        //Route::get('/patients/{patient}/download-pdf', [PatientController::class, 'downloadPDF']);
        Route::get('/patients/{patient}/download-pdf', [PatientPdfController::class, 'download'])->name('admin.patients.downloadPdf');
        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('admin.patients.consultations.store');
        Route::put('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'update'])->name('consultations.update');
        Route::delete('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'destroy'])->name('consultations.destroy');

        Route::get('/patients/{patient}/forms', [PatientController::class, 'forms'])->name('admin.patients.forms');
        Route::get('/admin/forms/{form}/patients/{patient}/response', [FormResponseController::class, 'show'])->name('forms.patient.response');
    });

    // Nurse
    Route::prefix('nurse')->middleware('role:Nurse')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('nurse.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('nurse.patients.show');
        Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('nurse.patients.update');
        Route::get('/patients/{patient}/download-pdf', [PatientController::class, 'downloadPDF'])->name('nurse.patients.downloadPDF');

        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('nurse.patients.consultations.store');
    });
});


Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
