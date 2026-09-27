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
                        $query->whereNull('branch_id')
                            ->orWhere('branch_id', $user->branch_id);
                    });
            })
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $transactions,
        ]);
    }
}