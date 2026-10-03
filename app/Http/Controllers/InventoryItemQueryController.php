<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory items.',
            ], 403);
        }

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
         $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory items.',
            ], 403);
        }

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