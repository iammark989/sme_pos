<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryQueryController;
use App\Http\Controllers\ProductQueryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleQueryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()->load([
                'role',
                'branch',
            ]),
        ]);
    });

    Route::post('/sales', [SaleController::class, 'store']);

    Route::get('/sales', [SaleQueryController::class, 'index']);

    Route::get('/sales/{sale}', [SaleQueryController::class, 'show']);

    Route::get('/products', [ProductQueryController::class, 'index']);

    Route::get('/products/{product}', [ProductQueryController::class, 'show']);

    Route::get('/inventory/stocks', [InventoryQueryController::class, 'index']);

});