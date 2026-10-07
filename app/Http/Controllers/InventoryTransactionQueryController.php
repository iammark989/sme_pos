<?php

namespace App\Http\Controllers;

use App\Models\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryTransactionQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory transaction history.',
            ], 403);
        }

        $query = InventoryTransaction::query()
            ->with([
                'inventoryItem.uom',
                'warehouse.branch',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where('is_active', true)
                    ->where(function ($query) use ($user) {
                        if ($user->hasGlobalAccess()) {
                            // Owner and Global Admin can view all active warehouses.
                            return;
                        }

                        $query->where('branch_id', $user->branch_id);
                    });
            });

        /*
        |--------------------------------------------------------------------------
        | Search Inventory Item
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();

            $query->whereHas('inventoryItem', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Warehouse Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('warehouse_id')) {
            $query->where(
                'warehouse_id',
                $request->integer('warehouse_id')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Transaction Type Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('type')) {
            $query->where(
                'type',
                $request->string('type')->trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->date('date_from')
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->date('date_to')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max($request->integer('per_page', 20), 1),
            100
        );

        $transactions = $query
            ->latest('id')
            ->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | Transaction Category
        |--------------------------------------------------------------------------
        */

        $transactions->getCollection()->transform(function ($transaction) {
            $transaction->transaction_category = match ($transaction->type) {
                'stock_in' => 'Stock In',
                'sale' => 'Sale',
                'sale_reversal' => 'Sale Reversal',
                'adjustment' => 'Adjustment',
                'transfer_out', 'transfer_in' => 'Transfer',
                default => 'Other',
            };

            $transaction->related_warehouse = $transaction->relatedWarehouse();

            return $transaction;
        });

        return response()->json([
            'data' => $transactions,
        ]);
    }
}