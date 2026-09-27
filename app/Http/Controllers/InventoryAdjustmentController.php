<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InventoryAdjustmentController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],
            'inventory_item_id' => [
                'required',
                'integer',
                'exists:inventory_items,id',
            ],
            'adjustment_type' => [
                'required',
                'in:increase,decrease',
            ],
            'quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $user = $request->user();

        $warehouse = Warehouse::findOrFail(
            $validated['warehouse_id']
        );

        $inventoryItem = InventoryItem::findOrFail(
            $validated['inventory_item_id']
        );

        if ($warehouse->branch_id !== $user->branch_id) {
            return response()->json([
                'message' => 'You are not allowed to adjust stock in this warehouse.',
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
            $stock = $this->inventoryService->adjustStock(
                warehouse: $warehouse,
                inventoryItem: $inventoryItem,
                adjustmentType: $validated['adjustment_type'],
                quantity: (float) $validated['quantity'],
                notes: $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Stock adjustment completed successfully.',
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