<?php

use App\Http\Controllers\Web\Auth\LoginController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', [LoginController::class, 'create'])
    ->middleware('guest')
    ->name('login');

Route::post('/login', [LoginController::class, 'store'])
    ->middleware('guest')
    ->name('login.store');

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/Index');
    })->name('dashboard');

    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports');

    Route::get('/auth-test', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => $request->user()->load(['role', 'branch']),
        ]);    
    });

        Route::get('/pos', function () {
        return Inertia::render('POS/Index');
    })->name('pos');
    
});