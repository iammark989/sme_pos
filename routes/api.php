<?php

use App\Http\Controllers\AuthController;
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

});