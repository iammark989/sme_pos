<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\InventoryAdjustmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryQueryController;
use App\Http\Controllers\InventoryTransferController;
use App\Http\Controllers\ProductQueryController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseOrderQueryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleQueryController;
use App\Http\Controllers\SupplierQueryController;
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

    Route::post('/inventory/stock-in', [InventoryController::class, 'stockIn']);

    Route::post('/inventory/transfers', [InventoryTransferController::class, 'store']);

    Route::post('/inventory/adjustments', [InventoryAdjustmentController::class, 'store']);

    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);

    Route::get('/purchase-orders', [PurchaseOrderQueryController::class, 'index',]);

    Route::get('/purchase-orders/receivable', [PurchaseOrderQueryController::class, 'receivable',]);    

    Route::get('/purchase-orders/{purchaseOrder}', [ PurchaseOrderQueryController::class, 'show',])->whereNumber('purchaseOrder');

    Route::post('/purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit',]);

    Route::post('/goods-receipts', [GoodsReceiptController::class, 'store']);

    Route::get('/suppliers', [SupplierQueryController::class, 'index',]);

    Route::get('/suppliers/{supplier}', [SupplierQueryController::class, 'show',])->whereNumber('supplier');

});