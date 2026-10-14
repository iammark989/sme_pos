<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchManagementController;
use App\Http\Controllers\BranchQueryController;
use App\Http\Controllers\CategoryQueryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\InventoryAdjustmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryItemQueryController;
use App\Http\Controllers\InventoryQueryController;
use App\Http\Controllers\InventoryTransactionQueryController;
use App\Http\Controllers\InventoryTransferController;
use App\Http\Controllers\PosProductController;
use App\Http\Controllers\PosTransactionController;
use App\Http\Controllers\ProductManagementController;
use App\Http\Controllers\ProductQueryController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseOrderQueryController;
use App\Http\Controllers\Reports\SalesReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleQueryController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\ShiftQueryController;
use App\Http\Controllers\SupplierQueryController;
use App\Http\Controllers\TransactionHistoryController;
use App\Http\Controllers\UomController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\VoidTransactionController;
use App\Http\Controllers\WarehouseManagementController;
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

    Route::get('/inventory/stocks/export', [InventoryQueryController::class, 'export',]);

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

    Route::patch('/inventory-items/{inventoryItem}/status', [InventoryItemQueryController::class, 'updateStatus'])->whereNumber('inventoryItem');

    Route::post('/inventory-items', [InventoryItemQueryController::class, 'store']);

    Route::put('/inventory-items/{inventoryItem}', [InventoryItemQueryController::class, 'update'])->whereNumber('inventoryItem');
    
    Route::get('/warehouses', [WarehouseQueryController::class, 'index',]);

    Route::get('/warehouses/{warehouse}', [WarehouseQueryController::class, 'show',])->whereNumber('warehouse');

    Route::post('/shifts/open', [ShiftController::class, 'open']);

    Route::get('/shifts/current', [ShiftController::class, 'current']);
    
    Route::get('/shifts', [ShiftQueryController::class, 'index']);

    Route::post('/shifts/close', [ShiftController::class, 'close']);

    Route::get('/shifts/{shift}', [ShiftQueryController::class, 'show'])->whereNumber('shift');

    Route::get('/pos/products', [PosProductController::class, 'index']);

    Route::get('/reports/sales/daily', [SalesReportController::class, 'daily',]);

    Route::get('/reports/sales/daily/products', [SalesReportController::class, 'dailyProducts',]);

    Route::get('/reports/sales', [SalesReportController::class, 'range',]);

    Route::get('/reports/sales/export', [SalesReportController::class, 'exportRange',]);

    Route::get('/reports/sales/daily/products/export', [SalesReportController::class, 'exportDailyProducts',]);

    Route::get('/branches', [BranchQueryController::class, 'index']);

    Route::get('/pos/transactions', [PosTransactionController::class, 'index',]);

    Route::get('/pos/transactions/{sale}', [PosTransactionController::class, 'show',])->whereNumber('sale');

    Route::get('/transactions', [TransactionHistoryController::class, 'index',]);

    Route::get('/inventory/transactions/export', [InventoryTransactionQueryController::class, 'export',]);

    Route::get('/transactions/{sale}', [TransactionHistoryController::class, 'show',])->whereNumber('sale');

    Route::post('/transactions/{sale}/void', [VoidTransactionController::class, 'store',])->whereNumber('sale');

    Route::get('/users', [UserManagementController::class, 'index']);
    
    Route::get('/users/{managedUser}', [UserManagementController::class, 'show'])->whereNumber('managedUser');

    Route::post('/users', [UserManagementController::class, 'store']);

    Route::put('/users/{managedUser}', [UserManagementController::class, 'update'])->whereNumber('managedUser');

    Route::delete('/users/{managedUser}', [UserManagementController::class, 'destroy'])->whereNumber('managedUser');

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/product-categories', [CategoryQueryController::class, 'index',]);

    Route::post('/product-categories', [CategoryQueryController::class, 'store']);

    Route::put('/product-categories/{category}', [CategoryQueryController::class, 'update'])->whereNumber('category');

    Route::patch('/product-categories/{category}/status', [CategoryQueryController::class, 'updateStatus'])->whereNumber('category');

    Route::get('/product-management', [ProductManagementController::class, 'index',]);

    Route::post('/product-management', [ProductManagementController::class, 'store',]);

    Route::get('/product-management/{product}', [ProductManagementController::class, 'show',])->whereNumber('product');

    Route::put('/product-management/{product}', [ProductManagementController::class, 'update',])->whereNumber('product');

    Route::get('/uoms', [UomController::class, 'index']);

    Route::post('/uoms', [UomController::class, 'store']);

    Route::put('/uoms/{uom}', [UomController::class, 'update'])->whereNumber('uom');

    Route::get('/branch-management', [BranchManagementController::class, 'index']);

    Route::post('/branch-management', [BranchManagementController::class, 'store']);

    Route::get('/branch-management/{branch}', [BranchManagementController::class, 'show'])->whereNumber('branch');

    Route::put('/branch-management/{branch}', [BranchManagementController::class, 'update'])->whereNumber('branch');

    Route::patch('/branch-management/{branch}/status', [BranchManagementController::class, 'updateStatus'])->whereNumber('branch');

    Route::get('/warehouse-management', [WarehouseManagementController::class, 'index']);

    Route::post('/warehouse-management', [WarehouseManagementController::class, 'store']);
    
    Route::get('/warehouse-management/{warehouse}', [WarehouseManagementController::class, 'show'])->whereNumber('warehouse');

    Route::put('/warehouse-management/{warehouse}', [WarehouseManagementController::class, 'update'])->whereNumber('warehouse');

    Route::patch('/warehouse-management/{warehouse}/status', [WarehouseManagementController::class, 'updateStatus'])->whereNumber('warehouse');

});