<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InventoryTransferController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],
            'destination_warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
                'different:source_warehouse_id',
            ],
            'inventory_item_id' => [
                'required',
                'integer',
                'exists:inventory_items,id',
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

        $sourceWarehouse = Warehouse::findOrFail(
            $validated['source_warehouse_id']
        );

        $destinationWarehouse = Warehouse::findOrFail(
            $validated['destination_warehouse_id']
        );

        $inventoryItem = InventoryItem::findOrFail(
            $validated['inventory_item_id']
        );

        /*
         * Staff can only initiate transfers from warehouses
         * belonging to their assigned branch.
         */
        if ($sourceWarehouse->branch_id !== $user->branch_id) {
            return response()->json([
                'message' => 'You are not allowed to transfer stock from this warehouse.',
            ], 403);
        }

        if (!$sourceWarehouse->is_active) {
            return response()->json([
                'message' => 'The source warehouse is inactive.',
            ], 422);
        }

        if (!$destinationWarehouse->is_active) {
            return response()->json([
                'message' => 'The destination warehouse is inactive.',
            ], 422);
        }

        if (!$inventoryItem->is_active) {
            return response()->json([
                'message' => 'The selected inventory item is inactive.',
            ], 422);
        }

        try {
            $result = $this->inventoryService->transferStock(
                sourceWarehouse: $sourceWarehouse,
                destinationWarehouse: $destinationWarehouse,
                inventoryItem: $inventoryItem,
                quantity: (float) $validated['quantity'],
                notes: $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Stock transfer completed successfully.',
                'data' => [
                    'transfer_reference' => $result['transfer_reference'],

                    'source_stock' => $result['source_stock']->load([
                        'inventoryItem.uom',
                        'warehouse',
                    ]),

                    'destination_stock' => $result['destination_stock']->load([
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