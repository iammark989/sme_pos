<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = InventoryStock::query()
            ->with([
                'inventoryItem.uom',
                'warehouse.branch',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where('is_active', true)
                    ->where(function ($query) use ($user) {
                        if ($user->role?->name === 'Owner') {
                            // Owner can view all active warehouses.
                            return;
                        }

                        $query->whereNull('branch_id')
                            ->orWhere('branch_id', $user->branch_id);
                    });
            });

        /*
        |--------------------------------------------------------------------------
        | Warehouse filter
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
        | Inventory item filter
        |--------------------------------------------------------------------------
        */
        if ($request->filled('inventory_item_id')) {
            $query->where(
                'inventory_item_id',
                $request->integer('inventory_item_id')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Search inventory item
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
        | Low-stock filter
        |--------------------------------------------------------------------------
        */
        if ($request->boolean('low_stock')) {
            $query->whereHas('inventoryItem', function ($query) {
                $query->whereColumn(
                    'inventory_stocks.quantity',
                    '<=',
                    'inventory_items.reorder_level'
                );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */
        $query->latest('id');

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */
        $perPage = min(
            max($request->integer('per_page', 20), 1),
            100
        );

        $stocks = $query->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | Add computed low-stock flag
        |--------------------------------------------------------------------------
        */
        $stocks->getCollection()->transform(function ($stock) {
            $stock->is_low_stock =
                (float) $stock->quantity <=
                (float) $stock->inventoryItem->reorder_level;

            return $stock;
        });

        return response()->json([
            'data' => $stocks,
        ]);
    }
}