<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchQueryController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\InventoryAdjustmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryItemQueryController;
use App\Http\Controllers\InventoryQueryController;
use App\Http\Controllers\InventoryTransactionQueryController;
use App\Http\Controllers\InventoryTransferController;
use App\Http\Controllers\PosProductController;
use App\Http\Controllers\PosTransactionController;
use App\Http\Controllers\ProductQueryController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseOrderQueryController;
use App\Http\Controllers\Reports\SalesReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleQueryController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ShiftQueryController;
use App\Http\Controllers\SupplierQueryController;
use App\Http\Controllers\WarehouseQueryController;
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

    Route::get('/inventory/transactions', [InventoryTransactionQueryController::class, 'index',]);

    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);

    Route::get('/purchase-orders', [PurchaseOrderQueryController::class, 'index',]);

    Route::get('/purchase-orders/receivable', [PurchaseOrderQueryController::class, 'receivable',]);    

    Route::get('/purchase-orders/{purchaseOrder}', [ PurchaseOrderQueryController::class, 'show',])->whereNumber('purchaseOrder');

    Route::post('/purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit',]);

    Route::post('/goods-receipts', [GoodsReceiptController::class, 'store']);

    Route::get('/suppliers', [SupplierQueryController::class, 'index',]);

    Route::get('/suppliers/{supplier}', [SupplierQueryController::class, 'show',])->whereNumber('supplier');

    Route::get('/inventory-items', [InventoryItemQueryController::class, 'index',]);

    Route::get('/inventory-items/{inventoryItem}', [InventoryItemQueryController::class, 'show',])->whereNumber('inventoryItem');

    Route::get('/warehouses', [WarehouseQueryController::class, 'index',]);

    Route::get('/warehouses/{warehouse}', [WarehouseQueryController::class, 'show',])->whereNumber('warehouse');

    Route::post('/shifts/open', [ShiftController::class, 'open']);

    Route::get('/shifts/current', [ShiftController::class, 'current']);

    Route::post('/shifts/close', [ShiftController::class, 'close']);

    Route::get('/shifts/{shift}', [ShiftQueryController::class, 'show'])->whereNumber('shift');

    Route::get('/pos/products', [PosProductController::class, 'index']);

    Route::get('/reports/sales/daily', [SalesReportController::class, 'daily',]);

    Route::get('/reports/sales/daily/products', [SalesReportController::class, 'dailyProducts',]);

    Route::get('/reports/sales', [SalesReportController::class, 'range',]);

    Route::get('/branches', [BranchQueryController::class, 'index']);

    Route::get('/pos/transactions', [PosTransactionController::class, 'index',]);
});