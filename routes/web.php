<?php

use App\Http\Controllers\Web\Auth\LoginController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LoginController::class, 'create'])
    ->middleware('guest')
    ->name('login.home');

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

        Route::get('/pos', function () {
        return Inertia::render('POS/Index');
    })->name('pos');
    
        Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports');
    
    Route::get('/reports/transactions', function () {
        return Inertia::render('Reports/Transactions');
    })->name('reports.transactions');

    Route::get('/shift', function () {
        return Inertia::render('Shifts/Current');
    });

    Route::get('/shifts', function () {
        return Inertia::render('Shifts/Index');
    })->middleware(['auth'])->name('shifts.index');

    Route::get('/inventory', function () {
        return Inertia::render('Inventory/Index');
    })->middleware('auth');

    Route::get('/inventory/transactions', function () {
        return Inertia::render('Inventory/Transactions');
    })->middleware(['auth']);

    Route::get('/admin/products', function () {
    return Inertia::render('Products/Index');
    })->name('products.index');

    Route::get('/admin/products/{product}', function ($product) {
        return Inertia::render('Products/Show', [
            'productId' => (int) $product,
        ]);
    })->whereNumber('product')->name('products.show');

    Route::get('/inventory-items', function () {
        return Inertia::render('InventoryItems/Index');
    })->name('inventory-items.index');

    Route::get('/inventory-items/create', function () {
        return Inertia::render('InventoryItems/Create');
    })->name('inventory-items.create');

    Route::get('/inventory-items/{inventoryItem}/edit', function ($inventoryItem) {
        return Inertia::render('InventoryItems/Edit', [
            'inventoryItemId' => (int) $inventoryItem,
        ]);
    })->whereNumber('inventoryItem')->name('inventory-items.edit');

});