<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\InventoryStock;
use App\Models\Sale;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, [
            'Owner',
            'Admin',
            'Accounting',
            'Staff',
        ], true)) {
            return response()->json([
                'message' => 'You are not authorized to view the dashboard.',
            ], 403);
        }

        /*
         * ---------------------------------------------------------
         * Resolve dashboard branch
         * ---------------------------------------------------------
         */
        if ($user->hasGlobalAccess()) {
            $validated = $request->validate([
                'branch_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('branches', 'id')
                        ->where('is_active', true),
                ],
            ]);

            $branchId = isset($validated['branch_id'])
                ? (int) $validated['branch_id']
                : (int) Branch::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->orderBy('id')
                    ->value('id');

            if (!$branchId) {
                return response()->json([
                    'message' => 'No active branches are available.',
                ], 422);
            }
        } else {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Your account is not assigned to a branch.',
                ], 403);
            }

            // Branch-scoped users cannot select another branch.
            $branchId = (int) $user->branch_id;
        }

        $branch = Branch::query()->find($branchId);

        $today = now()->toDateString();

        /*
         * ---------------------------------------------------------
         * Sales scope
         * ---------------------------------------------------------
         */
        $salesQuery = Sale::query()
            ->where('branch_id', $branchId)
            ->whereDate('created_at', $today);

        $completedSalesQuery = (clone $salesQuery)
            ->where('status', 'completed');

        $voidedSalesQuery = (clone $salesQuery)
            ->where('status', 'voided');

        $transactionCount = (clone $completedSalesQuery)->count();

        $todaySales = (clone $completedSalesQuery)
            ->sum('total_amount');

        $cashSales = (clone $completedSalesQuery)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'cash');
            })
            ->sum('total_amount');

        $gcashSales = (clone $completedSalesQuery)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'gcash');
            })
            ->sum('total_amount');

        $voidedTransactions = (clone $voidedSalesQuery)->count();

        /*
         * ---------------------------------------------------------
         * Low stock
         * ---------------------------------------------------------
         */
        $lowStockQuery = InventoryStock::query()
            ->with([
                'inventoryItem.uom',
                'warehouse.branch',
            ])
            ->whereHas('inventoryItem', function ($query) {
                $query->where('is_active', true)
                    ->whereColumn(
                        'inventory_stocks.quantity',
                        '<=',
                        'inventory_items.reorder_level'
                    );
            })
            ->whereHas('warehouse', function ($query) use ($branchId) {
                $query->where('is_active', true)
                    ->where('branch_id', $branchId);
            });

        $lowStockCount = (clone $lowStockQuery)->count();

        $lowStock = $lowStockQuery
            ->orderBy('quantity')
            ->limit(10)
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'inventory_item_id' => $stock->inventory_item_id,
                    'inventory_item' => $stock->inventoryItem?->name,
                    'sku' => $stock->inventoryItem?->sku,
                    'quantity' => (float) $stock->quantity,
                    'reorder_level' => (float) $stock->inventoryItem?->reorder_level,
                    'uom' => $stock->inventoryItem?->uom?->abbreviation,
                    'warehouse' => $stock->warehouse?->name,
                    'branch' => $stock->warehouse?->branch?->name,
                ];
            })
            ->values();

        /*
         * ---------------------------------------------------------
         * Open shifts
         * ---------------------------------------------------------
         */
        $openShiftsQuery = Shift::query()
            ->where('branch_id', $branchId)
            ->where('status', 'open');

        if ($user->role?->name === 'Staff') {
            $openShiftsQuery->where('user_id', $user->id);
        }

        $openShifts = $openShiftsQuery->count();

        /*
         * ---------------------------------------------------------
         * Recent transactions
         * ---------------------------------------------------------
         */
        $recentTransactionsQuery = Sale::query()
            ->with([
                'payments',
                'user',
                'branch',
            ])
            ->where('branch_id', $branchId);

        if ($user->role?->name === 'Staff') {
            $recentTransactionsQuery->where('user_id', $user->id);
        }

        $recentTransactions = $recentTransactionsQuery
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                $payment = $sale->payments->first();

                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'status' => $sale->status,
                    'total_amount' => (float) $sale->total_amount,
                    'payment_method' => $payment?->method,
                    'cashier' => $sale->user?->first_name
                        ? trim(
                            $sale->user->first_name .
                            ' ' .
                            $sale->user->last_name
                        )
                        : null,
                    'branch' => $sale->branch?->name,
                    'created_at' => $sale->created_at,
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'date' => $today,
                'branch_id' => $branchId,
                'branch_name' => $branch?->name,
                'today_sales' => round((float) $todaySales, 2),
                'transaction_count' => $transactionCount,
                'cash_sales' => round((float) $cashSales, 2),
                'gcash_sales' => round((float) $gcashSales, 2),
                'voided_transactions' => $voidedTransactions,
                'low_stock_items' => $lowStockCount,
                'open_shifts' => $openShifts,
                'low_stock' => $lowStock,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }
}