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

    Route::get('/products', function () {
    return Inertia::render('Products/Index');
    })->middleware('role:Owner,Admin')->name('products.index');

    Route::get('/products/{product}', function ($product) {
        return Inertia::render('Products/Show', [
            'productId' => (int) $product,
        ]);
    })->middleware('role:Owner,Admin')->whereNumber('product')->name('products.show');

    Route::get('/products/create', function () {
        return Inertia::render('Products/Create');
    })->middleware('role:Owner,Admin')->name('products.create');

    Route::get('/products/{product}/edit', function ($product) {
        return Inertia::render('Products/Edit', [
            'productId' => (int) $product,
        ]);
    })->middleware('role:Owner,Admin')->whereNumber('product')->name('products.edit');

    Route::get('/inventory-items', function () {
        return Inertia::render('InventoryItems/Index');
    })->middleware('role:Owner,Admin,Accounting')->name('inventory-items.index');

    Route::get('/inventory-items/create', function () {
        return Inertia::render('InventoryItems/Create');
    })->middleware('role:Owner,Admin')->name('inventory-items.create');

    Route::get('/inventory-items/{inventoryItem}/edit', function ($inventoryItem) {
        return Inertia::render('InventoryItems/Edit', [
            'inventoryItemId' => (int) $inventoryItem,
        ]);
    })->whereNumber('inventoryItem')->middleware('role:Owner,Admin')->name('inventory-items.edit');

    Route::get('/users', function () {
        return Inertia::render('Users/Index');
    })->middleware('role:Owner,Admin')->name('users.index');

    Route::get('/branches', function () {
        return Inertia::render('Branches/Index');
    })->middleware('role:Owner,Admin')->name('branches.index');

});