<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Exports\InventoryStocksExport;
use Maatwebsite\Excel\Facades\Excel;

class InventoryQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory stocks.',
            ], 403);
        }

        $query = InventoryStock::query()
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

    public function export(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to export inventory stocks.',
            ], 403);
        }

        $validated = $request->validate([
            'warehouse_id' => ['nullable', 'integer'],
            'inventory_item_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:255'],
            'low_stock' => ['nullable', 'boolean'],
        ]);

        $query = InventoryStock::query()
            ->with([
                'inventoryItem.uom',
                'warehouse.branch',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where('is_active', true)
                    ->where(function ($query) use ($user) {
                        if ($user->hasGlobalAccess()) {
                            return;
                        }

                        $query->where('branch_id', $user->branch_id);
                    });
            });

        if (!empty($validated['warehouse_id'])) {
            $query->where('warehouse_id', $validated['warehouse_id']);
        }

        if (!empty($validated['inventory_item_id'])) {
            $query->where('inventory_item_id', $validated['inventory_item_id']);
        }

        if (!empty($validated['search'])) {
            $search = trim($validated['search']);

            $query->whereHas('inventoryItem', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            });
        }

        if (!empty($validated['low_stock'])) {
            $query->whereHas('inventoryItem', function ($query) {
                $query->whereColumn(
                    'inventory_stocks.quantity',
                    '<=',
                    'inventory_items.reorder_level'
                );
            });
        }

        $stocks = $query
            ->latest('id')
            ->get()
            ->map(function ($stock) {
                $item = $stock->inventoryItem;
                $warehouse = $stock->warehouse;
                $uom = $item?->uom;

                $quantity = (float) $stock->quantity;
                $reorderLevel = (float) ($item?->reorder_level ?? 0);

                return [
                    'sku' => $item?->sku ?? '',
                    'item' => $item?->name ?? '',
                    'warehouse' => $warehouse?->name ?? '',
                    'branch' => $warehouse?->branch?->name ?? '',
                    'quantity' => $quantity,
                    'uom' => $uom?->abbreviation
                        ?? $uom?->symbol
                        ?? $uom?->name
                        ?? '',
                    'reorder_level' => $reorderLevel,
                    'status' => $quantity <= $reorderLevel
                        ? 'Low Stock'
                        : 'In Stock',
                ];
            })
            ->all();

        return Excel::download(
            new InventoryStocksExport($stocks),
            !empty($validated['low_stock'])
                ? 'inventory-low-stock.xlsx'
                : 'inventory-stock-on-hand.xlsx'
        );
    }
}