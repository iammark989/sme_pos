<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $inventoryItems = InventoryItem::query()
            ->with('uom')
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $inventoryItems,
        ]);
    }

    public function show(
        Request $request,
        InventoryItem $inventoryItem
    ): JsonResponse {
        if (!$inventoryItem->is_active) {
            return response()->json([
                'message' => 'Inventory item is inactive.',
            ], 404);
        }

        $inventoryItem->load('uom');

        return response()->json([
            'data' => [
                'inventory_item' => $inventoryItem,
            ],
        ]);
    }
}