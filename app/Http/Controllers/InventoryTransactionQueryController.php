<?php

namespace App\Http\Controllers;

use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Exports\InventoryMovementExport;
use Maatwebsite\Excel\Facades\Excel;

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
        | Branch Filter (Global Access Only)
        |--------------------------------------------------------------------------
        */

        if ($user->hasGlobalAccess() && $request->filled('branch_id')) {
            $query->whereHas('warehouse', function ($query) use ($request) {
                $query->where('branch_id', $request->integer('branch_id'));
            });
        }

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
        | Inventory Movement Summary
        |--------------------------------------------------------------------------
        | Calculate totals across all filtered transactions, before pagination.
        */

        $summary = (clone $query)
            ->selectRaw("
                COUNT(*) AS total_transactions,

                SUM(CASE WHEN type = 'stock_in' THEN 1 ELSE 0 END)
                    AS stock_in_count,
                COALESCE(SUM(CASE WHEN type = 'stock_in' THEN quantity ELSE 0 END), 0)
                    AS stock_in_quantity,

                SUM(CASE WHEN type = 'sale' THEN 1 ELSE 0 END)
                    AS sale_count,
                COALESCE(SUM(CASE WHEN type = 'sale' THEN quantity ELSE 0 END), 0)
                    AS sale_quantity,

                SUM(CASE WHEN type = 'sale_reversal' THEN 1 ELSE 0 END)
                    AS sale_reversal_count,
                COALESCE(SUM(CASE WHEN type = 'sale_reversal' THEN quantity ELSE 0 END), 0)
                    AS sale_reversal_quantity,

                SUM(CASE WHEN type = 'adjustment' THEN 1 ELSE 0 END)
                    AS adjustment_count,
                COALESCE(SUM(CASE WHEN type = 'adjustment' THEN quantity ELSE 0 END), 0)
                    AS adjustment_quantity,

                SUM(CASE WHEN type = 'transfer_in' THEN 1 ELSE 0 END)
                    AS transfer_in_count,
                COALESCE(SUM(CASE WHEN type = 'transfer_in' THEN quantity ELSE 0 END), 0)
                    AS transfer_in_quantity,

                SUM(CASE WHEN type = 'transfer_out' THEN 1 ELSE 0 END)
                    AS transfer_out_count,
                COALESCE(SUM(CASE WHEN type = 'transfer_out' THEN quantity ELSE 0 END), 0)
                    AS transfer_out_quantity
            ")
            ->first();

       /*
        |--------------------------------------------------------------------------
        | Fetch and Group Transaction Movements
        |--------------------------------------------------------------------------
        */

        $transactions = $query
            ->latest('id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Group Movements into Transaction Documents
        |--------------------------------------------------------------------------
        */

        $groupedTransactions = $transactions
            ->groupBy(function ($transaction) {
                return match ($transaction->type) {
                    'stock_in' => $transaction->reference_type && $transaction->reference_id
                        ? 'stock_in_' . $transaction->reference_type . '_' . $transaction->reference_id
                        : 'stock_in_' . $transaction->id,

                    'transfer_in', 'transfer_out' => $transaction->transfer_reference
                        ? 'transfer_' . $transaction->transfer_reference
                        : 'transfer_' . $transaction->id,

                    'sale', 'sale_reversal' => $transaction->reference_type && $transaction->reference_id
                        ? $transaction->type . '_' . $transaction->reference_type . '_' . $transaction->reference_id
                        : $transaction->type . '_' . $transaction->id,

                    'adjustment' => 'adjustment_' . $transaction->id,

                    default => 'transaction_' . $transaction->id,
                };
            })
            ->map(function ($movements) use ($user) {
                $first = $movements->first();

                $items = $movements->map(function ($transaction) use ($user) {
                    $relatedWarehouse = $transaction->relatedWarehouse();

                    if (
                        $relatedWarehouse
                        && $relatedWarehouse->is_active
                        && (
                            $user->hasGlobalAccess()
                            || (
                                $user->branch_id !== null
                                && (int) $relatedWarehouse->branch_id === (int) $user->branch_id
                            )
                        )
                    ) {
                        $transaction->related_warehouse = $relatedWarehouse;
                    } else {
                        $transaction->related_warehouse = null;
                    }

                    $transaction->transaction_category = match ($transaction->type) {
                        'stock_in' => 'Stock In',
                        'sale' => 'Sale',
                        'sale_reversal' => 'Sale Reversal',
                        'adjustment' => 'Adjustment',
                        'transfer_out', 'transfer_in' => 'Stock Transfer',
                        default => 'Other',
                    };

                    return $transaction;
                });

                $reference = match (true) {
                    !empty($first->transfer_reference) => $first->transfer_reference,

                    !empty($first->reference_type) && !empty($first->reference_id) =>
                        class_basename($first->reference_type) . ' #' . $first->reference_id,

                    $first->type === 'adjustment' =>
                        'Adjustment #' . $first->id,

                    default => 'Transaction #' . $first->id,
                };

                return [
                    'id' => $first->id,
                    'transaction_category' => match ($first->type) {
                        'stock_in' => 'Stock In',
                        'sale' => 'Sale',
                        'sale_reversal' => 'Sale Reversal',
                        'adjustment' => 'Stock Adjustment',
                        'transfer_in', 'transfer_out' => 'Stock Transfer',
                        default => 'Other',
                    },
                    'reference' => $reference,
                    'date' => $movements->max('created_at'),
                    'item_count' => $items->count(),
                    'items' => $items->values(),
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max($request->integer('per_page', 20), 1),
            100
        );

        $page = LengthAwarePaginator::resolveCurrentPage();

        $paginatedTransactions = new LengthAwarePaginator(
            $groupedTransactions->forPage($page, $perPage)->values(),
            $groupedTransactions->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return response()->json([
            'summary' => $summary,
            'data' => $paginatedTransactions,
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to export inventory transaction history.',
            ], 403);
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'warehouse_id' => ['nullable', 'integer', 'min:1'],
            'type' => [
                'nullable',
                'string',
                'in:stock_in,sale,sale_reversal,adjustment,transfer_in,transfer_out',
            ],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:date_from',
            ],
            'branch_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = InventoryTransaction::query()
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

            /*
            |--------------------------------------------------------------------------
            | Branch Filter (Global Access Only)
            |--------------------------------------------------------------------------
            */
            if ($user->hasGlobalAccess() && !empty($validated['branch_id'])) {
                $query->whereHas('warehouse', function ($query) use ($validated) {
                    $query->where('branch_id', $validated['branch_id']);
                });
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

        if (!empty($validated['warehouse_id'])) {
            $query->where('warehouse_id', $validated['warehouse_id']);
        }

        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $transactions = $query
            ->latest('id')
            ->get()
            ->map(function ($transaction) use ($user) {
                $relatedWarehouse = $transaction->relatedWarehouse();

                if (
                    $relatedWarehouse
                    && $relatedWarehouse->is_active
                    && (
                        $user->hasGlobalAccess()
                        || (
                            $user->branch_id !== null
                            && (int) $relatedWarehouse->branch_id === (int) $user->branch_id
                        )
                    )
                ) {
                    $relatedWarehouseName = $relatedWarehouse->name;
                } else {
                    $relatedWarehouseName = '';
                }

                $reference = $transaction->transfer_reference
                    ?: (
                        $transaction->reference_type && $transaction->reference_id
                            ? class_basename($transaction->reference_type)
                                . ' #' . $transaction->reference_id
                            : ($transaction->notes ?? '')
                    );

                return [
                    'date' => $transaction->created_at?->format('Y-m-d H:i:s') ?? '',
                    'sku' => $transaction->inventoryItem?->sku ?? '',
                    'item' => $transaction->inventoryItem?->name ?? '',
                    'transaction_category' => match ($transaction->type) {
                        'stock_in' => 'Stock In',
                        'sale' => 'Sale',
                        'sale_reversal' => 'Sale Reversal',
                        'adjustment' => 'Adjustment',
                        'transfer_out', 'transfer_in' => 'Transfer',
                        default => 'Other',
                    },
                    'type' => $transaction->type,
                    'quantity' => $transaction->quantity,
                    'warehouse' => $transaction->warehouse?->name ?? '',
                    'related_warehouse' => $relatedWarehouseName,
                    'reference' => $reference,
                ];
            })
            ->all();

        return Excel::download(
            new InventoryMovementExport($transactions),
            'inventory-movement-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

}