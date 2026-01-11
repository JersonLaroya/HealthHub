<?php

use App\Http\Controllers\Admin\DiseaseCategoryController;
use App\Http\Controllers\Admin\ListOfDiseaseController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DtrController;
use App\Http\Controllers\Admin\RcyMemberController;
use App\Http\Controllers\FormAssignmentController;
use App\Http\Controllers\FormResponseController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientPdfController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Admin\PersonnelController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\User\FileController;
use App\Http\Controllers\User\MedicalFormController;
use App\Http\Controllers\User\PersonalInfoController;
use App\Http\Controllers\User\RcyController;
use App\Http\Middleware\ExcludeRolesMiddleware;
use App\Http\Middleware\RcyRoleMiddleware;
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


// Routes for User
Route::middleware(['auth', ExcludeRolesMiddleware::class])
    ->prefix('user')
    ->name('user.')
    ->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('user/dashboard');
    })->name('dashboard');

    // Personal Information page (view & update)
    Route::get('/personal-info', [PersonalInfoController::class, 'edit'])
        ->name('personal-info.edit');
    Route::put('/personal-info', [PersonalInfoController::class, 'update'])
        ->name('personal-info.update');

    // =========================
    // Files page
    // =========================
    Route::get('/files', [FileController::class, 'index'])
        ->name('files.index');

    Route::get('/files/{slug}', [FileController::class, 'show'])
        ->name('files.show');

    Route::get('/files/{slug}/download', [FileController::class, 'download'])
        ->name('files.download');

    Route::get('/files/{slug}/template', [FileController::class, 'getFormTemplate'])
        ->name('files.template');

    // =========================
    // Pre-enrollment
    // =========================
    Route::prefix('fill-forms/pre-enrollment-health-form')
        ->name('fill-forms.pre-enrollment.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'preenrollmentPage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'preenrollmentPage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'preenrollmentPage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'preenrollmentPage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'preenrollmentPage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'preenrollmentPage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'preenrollmentPage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // =========================
    // Pre-employment
    // =========================
    Route::prefix('fill-forms/pre-employment-health-form')
        ->name('fill-forms.pre-employment.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'preemploymentPage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'preemploymentPage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'preemploymentPage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'preemploymentPage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'preemploymentPage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'preemploymentPage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'preemploymentPage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // =========================
    // Athlete
    // =========================
    Route::prefix('fill-forms/athlete-medical')
        ->name('fill-forms.athlete-medical.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'athletePage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'athletePage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'athletePage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'athletePage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'athletePage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'athletePage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'athletePage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // Submit Form
    Route::post('/submit/{formType}', [FileController::class, 'submitForm'])
        ->name('submit.form');
    
    Route::get('/files/{slug}/confirmation', function ($slug) {
        return Inertia::render('user/files/Confirmation', [
            'slug' => $slug,
        ]);
    })->name('files.confirmation');

    Route::get('/records', function () {
        return Inertia::render('user/records');
    })->name('records');

    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile');
});

// Routes for Admin
Route::middleware(['role:Admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('admin/dashboard');
        })->name('dashboard');

        Route::get('/events', fn() => Inertia::render('admin/events'))->name('events');
        Route::get('/files', fn() => Inertia::render('admin/files'))->name('files');
        Route::get('/reports', fn() => Inertia::render('admin/reports'))->name('reports');

        Route::resource('personnels', PersonnelController::class);
        Route::post('/personnels', [PersonnelController::class, 'store'])->name('admin.personnels.store');
        Route::put('/personnels/{personnel}', [PersonnelController::class, 'update'])->name('admin.personnels.update');
        Route::delete('/personnels/{personnel}', [PersonnelController::class, 'destroy'])->name('admin.personnels.destroy');

        // RCY Positions
        Route::get('/rcy/positions', [RcyMemberController::class, 'indexPositions'])->name('rcy.positions.index');
        Route::get('/rcy/positions/create', [RcyMemberController::class, 'createPosition'])->name('rcy.positions.create');
        Route::post('/rcy/positions', [RcyMemberController::class, 'storePosition'])->name('rcy.positions.store');
        Route::put('/rcy/positions/{position}', [RcyMemberController::class, 'updatePosition'])->name('rcy.positions.update');
        Route::delete('/rcy/positions/{position}', [RcyMemberController::class, 'destroyPosition'])->name('rcy.positions.destroy');

        // RCY Members
        Route::get('/rcy/members', [RcyMemberController::class, 'index'])->name('rcy.members.index');
        Route::get('/rcy/members/create', [RcyMemberController::class, 'createMember'])->name('rcy.members.create');
        Route::post('/rcy/members', [RcyMemberController::class, 'store'])->name('rcy.members.store');
        Route::put('/rcy/members/{user}', [RcyMemberController::class, 'update'])->name('rcy.members.update');
        Route::delete('/rcy/members/{user}', [RcyMemberController::class, 'destroy'])->name('rcy.members.destroy');
        Route::get('/rcy/members/search-students', [RcyMemberController::class, 'searchStudents'])->name('rcy.members.search');



        Route::get('/forms', [ServiceController::class, 'index'])->name('forms.index');
        Route::post('/forms', [ServiceController::class, 'store'])->name('forms.store');
        Route::put('/forms/{form}', [ServiceController::class, 'update'])->name('forms.update');
        Route::delete('/forms/{form}', [ServiceController::class, 'destroy'])->name('forms.destroy');

        Route::get('/form-assignments', [FormAssignmentController::class, 'index'])->name('form-assignments.index');
        Route::get('/form-assignments/create', [FormAssignmentController::class, 'create'])->name('form-assignments.create');
        Route::post('/form-assignments', [FormAssignmentController::class, 'store'])->name('form-assignments.store');
        Route::get('/form-assignments/search-users', [FormAssignmentController::class, 'searchUsers'])->name('form-assignments.search-users');
        Route::get('/form-assignments/auto-select-users', [FormAssignmentController::class, 'autoSelectUsers'])->name('form-assignments.auto-select-users');

        // Disease Categories
        Route::get('/disease-categories', [DiseaseCategoryController::class, 'index']);
        Route::post('/disease-categories', [DiseaseCategoryController::class, 'store']);
        Route::put('/disease-categories/{category}', [DiseaseCategoryController::class, 'update']);
        Route::delete('/disease-categories/{category}', [DiseaseCategoryController::class, 'destroy']);

        Route::get('/list-of-diseases', [ListOfDiseaseController::class, 'index']);
        Route::post('/list-of-diseases', [ListOfDiseaseController::class, 'store']);
        Route::put('/list-of-diseases/{disease}', [ListOfDiseaseController::class, 'update']);
        Route::delete('/list-of-diseases/{disease}', [ListOfDiseaseController::class, 'destroy']);

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
    Route::prefix('user')->middleware(['auth', RcyRoleMiddleware::class])->group(function () {
        Route::get('/rcy', [RcyController::class, 'create'])->name('rcy.add');
        Route::post('/rcy/{patient}', [RcyController::class, 'store'])->name('rcy.store');
        Route::get('/patients/search', [RcyController::class, 'searchPatients'])->name('patients.search');
    });
});

// Shared Admin & Nurse routes
Route::middleware(['auth', 'role:Admin,Nurse'])->group(function () {
    // Admin
    Route::prefix('admin')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('admin.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('admin.patients.show');
        Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('admin.patients.update');
        Route::get('/patients/{patient}/download-pdf', [PatientPdfController::class, 'download'])->name('admin.patients.downloadPdf');
        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('admin.patients.consultations.store');
        Route::put('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'update'])->name('admin.patients.consultations.update');
        Route::get('/patients/{patient}/files', [PatientController::class, 'files'])->name('admin.patients.files');
        Route::get('/patients/{patient}/files/{slug}', [PatientController::class, 'showFile'])->name('admin.patients.showFiles');
        Route::get('/patients/{patient}/files/{slug}/records/{record}',[PatientController::class, 'viewRecord'])->name('admin.patients.records.view');

        Route::delete('/patients/{patient}/files/{slug}/records/{record}', [PatientController::class, 'deleteRecord'])->name('admin.patients.records.delete');
        Route::delete('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'destroy'])->name('admin.patients.consultations.destroy');
        Route::patch('/patients/{patient}/consultations/{consultation}/approve', [ConsultationController::class, 'approve'])->name('admin.patients.consultations.approve');
    });

    // Nurse
    Route::prefix('nurse')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('nurse.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('nurse.patients.show');
        Route::get('/patients/{patient}/download-pdf', [PatientPdfController::class, 'download'])->name('nurse.patients.downloadPdf');
        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('nurse.patients.consultations.store');
        //Route::get('/patients/{patient}/forms', [PatientController::class, 'forms'])->name('nurse.patients.forms');
        Route::patch('/patients/{patient}/consultations/{consultation}/approve', [ConsultationController::class, 'approve'])->name('nurse.patients.consultations.approve');
    });
});


Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
