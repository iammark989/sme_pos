<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {
    }

    public function stockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'inventory_item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $warehouse = Warehouse::findOrFail($validated['warehouse_id']);
        $inventoryItem = InventoryItem::findOrFail(
            $validated['inventory_item_id']
        );

        if ($warehouse->branch_id !== $user->branch_id) {
            return response()->json([
                'message' => 'You are not allowed to stock inventory into this warehouse.',
            ], 403);
        }

        if (!$warehouse->is_active) {
            return response()->json([
                'message' => 'The selected warehouse is inactive.',
            ], 422);
        }

        if (!$inventoryItem->is_active) {
            return response()->json([
                'message' => 'The selected inventory item is inactive.',
            ], 422);
        }

        try {
            $stock = $this->inventoryService->stockIn(
                warehouse: $warehouse,
                inventoryItem: $inventoryItem,
                quantity: (float) $validated['quantity'],
                notes: $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Stock-in completed successfully.',
                'data' => [
                    'stock' => $stock->load([
                        'inventoryItem.uom',
                        'warehouse',
                    ]),
                ],
            ], 201);

        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}