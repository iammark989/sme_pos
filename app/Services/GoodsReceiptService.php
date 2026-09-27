<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GoodsReceiptService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    public function create(
        PurchaseOrder $purchaseOrder,
        Warehouse $warehouse,
        User $user,
        array $items,
        string $receivedDate,
        ?string $notes = null,
    ): GoodsReceipt {
        if (!in_array($purchaseOrder->status, ['submitted', 'partially_received'], true)) {
            throw new RuntimeException(
                "Purchase order '{$purchaseOrder->po_number}' cannot be received because its current status is '{$purchaseOrder->status}'."
            );
        }

        if (!$warehouse->is_active) {
            throw new RuntimeException('The selected warehouse is inactive.');
        }

        if ($purchaseOrder->warehouse_id !== $warehouse->id) {
            throw new RuntimeException(
                'The receiving warehouse does not match the purchase order warehouse.'
            );
        }

        if ($warehouse->branch_id !== $user->branch_id) {
            throw new RuntimeException(
                'You are not allowed to receive goods into this warehouse.'
            );
        }

        if (empty($items)) {
            throw new RuntimeException(
                'A goods receipt must contain at least one item.'
            );
        }

        return DB::transaction(function () use (
            $purchaseOrder,
            $warehouse,
            $user,
            $items,
            $receivedDate,
            $notes,
        ) {
            // Lock the purchase order so two receiving requests
            // cannot process the same PO simultaneously.
            $purchaseOrder = PurchaseOrder::query()
                ->lockForUpdate()
                ->findOrFail($purchaseOrder->id);

            if (!in_array($purchaseOrder->status, ['submitted', 'partially_received'], true)) {
                throw new RuntimeException(
                    "Purchase order '{$purchaseOrder->po_number}' cannot be received because its current status is '{$purchaseOrder->status}'."
                );
            }

            $purchaseOrder->load('items');

            $preparedItems = [];

            foreach ($items as $item) {
                $purchaseOrderItem = $purchaseOrder->items
                    ->firstWhere('inventory_item_id', $item['inventory_item_id']);

                if (!$purchaseOrderItem) {
                    throw new RuntimeException(
                        "Inventory item ID {$item['inventory_item_id']} does not belong to this purchase order."
                    );
                }

                $inventoryItem = InventoryItem::find($item['inventory_item_id']);

                if (!$inventoryItem) {
                    throw new RuntimeException(
                        "Inventory item ID {$item['inventory_item_id']} was not found."
                    );
                }

                if (!$inventoryItem->is_active) {
                    throw new RuntimeException(
                        "Inventory item '{$inventoryItem->name}' is inactive."
                    );
                }

                $quantity = (float) $item['quantity'];

                if ($quantity <= 0) {
                    throw new RuntimeException(
                        "Received quantity for '{$inventoryItem->name}' must be greater than zero."
                    );
                }

                $receivedQuantity = (float) $purchaseOrderItem->goodsReceiptItems()
                ->whereHas('goodsReceipt', function ($query) use ($purchaseOrder) {
                    $query->where('purchase_order_id', $purchaseOrder->id);
                })
                ->sum('quantity');

                $orderedQuantity = (float) $purchaseOrderItem->quantity;

                $remainingQuantity = $orderedQuantity - $receivedQuantity;

                if ($quantity > $remainingQuantity) {
                    throw new RuntimeException(
                        "Cannot receive {$quantity} of '{$inventoryItem->name}'. " .
                        "Remaining quantity is {$remainingQuantity}."
                    );
                }

                $unitCost = array_key_exists('unit_cost', $item)
                    ? (float) $item['unit_cost']
                    : (float) $purchaseOrderItem->unit_cost;

                if ($unitCost < 0) {
                    throw new RuntimeException(
                        "Unit cost for '{$inventoryItem->name}' cannot be negative."
                    );
                }

                $subtotal = round($quantity * $unitCost, 2);

                $preparedItems[] = [
                    'inventory_item' => $inventoryItem,
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'subtotal' => $subtotal,
                    'remaining_after' => $remainingQuantity - $quantity,
                ];
            }

            $goodsReceipt = GoodsReceipt::create([
                'purchase_order_id' => $purchaseOrder->id,
                'warehouse_id' => $warehouse->id,
                'user_id' => $user->id,
                'gr_number' => $this->generateGrNumber(),
                'received_date' => $receivedDate,
                'notes' => $notes,
            ]);

            foreach ($preparedItems as $item) {
                $goodsReceipt->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['subtotal'],
                ]);

                $this->inventoryService->stockIn(
                    warehouse: $warehouse,
                    inventoryItem: $item['inventory_item'],
                    quantity: $item['quantity'],
                    notes: "Goods Receipt {$goodsReceipt->gr_number}",
                    referenceType: GoodsReceipt::class,
                    referenceId: $goodsReceipt->id,
                );
            }

            $allFullyReceived = true;

            foreach ($purchaseOrder->items as $purchaseOrderItem) {
                $orderedQuantity = (float) $purchaseOrderItem->quantity;

                $receivedQuantity = (float) $purchaseOrderItem->goodsReceiptItems()
                ->whereHas('goodsReceipt', function ($query) use ($purchaseOrder) {
                    $query->where('purchase_order_id', $purchaseOrder->id);
                })
                ->sum('quantity');

                if ($receivedQuantity < $orderedQuantity) {
                    $allFullyReceived = false;
                    break;
                }
            }

            $purchaseOrder->update([
                'status' => $allFullyReceived
                    ? 'completed'
                    : 'partially_received',
            ]);

            return $goodsReceipt->load([
                'purchaseOrder',
                'warehouse',
                'user',
                'items.inventoryItem.uom',
            ]);
        });
    }

    private function generateGrNumber(): string
    {
        do {
            $number = 'GR-' . now()->format('YmdHis') . '-' . random_int(1000, 9999);
        } while (GoodsReceipt::where('gr_number', $number)->exists());

        return $number;
    }
}