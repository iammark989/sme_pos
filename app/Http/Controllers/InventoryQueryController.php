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

        $stocks = InventoryStock::query()
            ->with([
                'inventoryItem.uom',
                'warehouse',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where('branch_id', $user->branch_id);
            })
            ->latest()
            ->paginate(20);

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