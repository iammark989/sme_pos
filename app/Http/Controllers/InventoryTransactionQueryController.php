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

        $transactions = InventoryTransaction::query()
            ->with([
                'inventoryItem.uom',
                'warehouse.branch',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where('is_active', true)
                    ->where(function ($query) use ($user) {
                        if ($user->role?->name === 'Owner') {
                            return;
                        }

                        $query->whereNull('branch_id')
                            ->orWhere('branch_id', $user->branch_id);
                    });
            })
            ->latest()
            ->paginate(20);

        $transactions->getCollection()->transform(function ($transaction) {
            $transaction->transaction_category = match ($transaction->type) {
                'stock_in' => 'Stock In',
                'sale' => 'Sale',
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