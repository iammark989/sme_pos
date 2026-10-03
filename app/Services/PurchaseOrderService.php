<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PurchaseOrderService
{
    public function create(
        Supplier $supplier,
        Warehouse $warehouse,
        User $user,
        array $items,
        string $orderDate,
        ?string $expectedDate = null,
        ?string $notes = null,
    ): PurchaseOrder {
        if (!$supplier->is_active) {
            throw new RuntimeException('The selected supplier is inactive.');
        }

        if (!$warehouse->is_active) {
            throw new RuntimeException('The selected warehouse is inactive.');
        }

        if (
            $user->role?->name !== 'Owner'
            && $warehouse->branch_id !== $user->branch_id
        ) {
            throw new RuntimeException(
                'You are not allowed to create a purchase order for this warehouse.'
            );
        }

        if (empty($items)) {
            throw new RuntimeException('A purchase order must contain at least one item.');
        }

        return DB::transaction(function () use (
            $supplier,
            $warehouse,
            $user,
            $items,
            $orderDate,
            $expectedDate,
            $notes,
        ) {
            $totalAmount = 0;

            $preparedItems = [];

            foreach ($items as $item) {
                $inventoryItem = InventoryItem::find($item['inventory_item_id']);

                if (!$inventoryItem) {
                    throw new RuntimeException(
                        'Inventory item not found: ' . $item['inventory_item_id']
                    );
                }

                if (!$inventoryItem->is_active) {
                    throw new RuntimeException(
                        "Inventory item '{$inventoryItem->name}' is inactive."
                    );
                }

                $quantity = (float) $item['quantity'];
                $unitCost = (float) $item['unit_cost'];

                if ($quantity <= 0) {
                    throw new RuntimeException(
                        "Quantity for '{$inventoryItem->name}' must be greater than zero."
                    );
                }

                if ($unitCost < 0) {
                    throw new RuntimeException(
                        "Unit cost for '{$inventoryItem->name}' cannot be negative."
                    );
                }

                $subtotal = round($quantity * $unitCost, 2);

                $totalAmount += $subtotal;

                $preparedItems[] = [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'subtotal' => $subtotal,
                ];
            }

            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $supplier->id,
                'warehouse_id' => $warehouse->id,
                'user_id' => $user->id,
                'po_number' => $this->generatePoNumber(),
                'status' => 'draft',
                'order_date' => $orderDate,
                'expected_date' => $expectedDate,
                'total_amount' => round($totalAmount, 2),
                'notes' => $notes,
            ]);

            foreach ($preparedItems as $item) {
                $purchaseOrder->items()->create($item);
            }

            return $purchaseOrder->load([
                'supplier',
                'warehouse',
                'user',
                'items.inventoryItem.uom',
            ]);
        });
    }

    public function submit(PurchaseOrder $purchaseOrder): PurchaseOrder
    {
        if ($purchaseOrder->status !== 'draft') {
            throw new RuntimeException(
                "Purchase order '{$purchaseOrder->po_number}' cannot be submitted because its current status is '{$purchaseOrder->status}'."
            );
        }

        if ($purchaseOrder->items()->count() === 0) {
            throw new RuntimeException(
                'A purchase order must contain at least one item before it can be submitted.'
            );
        }

        $purchaseOrder->update([
            'status' => 'submitted',
        ]);

        return $purchaseOrder->fresh([
            'supplier',
            'warehouse',
            'user',
            'items.inventoryItem.uom',
        ]);
    }

    private function generatePoNumber(): string
    {
        do {
            $number = 'PO-' . now()->format('YmdHis') . '-' . random_int(1000, 9999);
        } while (PurchaseOrder::where('po_number', $number)->exists());

        return $number;
    }
}