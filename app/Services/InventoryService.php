<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    public function stockIn(
        Warehouse $warehouse,
        InventoryItem $inventoryItem,
        float $quantity,
        ?string $notes = null,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): InventoryStock {
        if ($quantity <= 0) {
            throw new RuntimeException('Stock-in quantity must be greater than zero.');
        }

        return DB::transaction(function () use (
            $warehouse,
            $inventoryItem,
            $quantity,
            $notes,
            $referenceType,
            $referenceId
        ) {
            $stock = InventoryStock::firstOrCreate(
                [
                    'warehouse_id' => $warehouse->id,
                    'inventory_item_id' => $inventoryItem->id,
                ],
                [
                    'quantity' => 0,
                ]
            );

            $stock->increment('quantity', $quantity);

            InventoryTransaction::create([
                'warehouse_id' => $warehouse->id,
                'inventory_item_id' => $inventoryItem->id,
                'type' => 'stock_in',
                'quantity' => $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
            ]);

            return $stock->fresh();
        });
    }

    public function deductStock(
        Warehouse $warehouse,
        InventoryItem $inventoryItem,
        float $quantity,
        ?string $notes = null,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): InventoryStock {
        if ($quantity <= 0) {
            throw new RuntimeException('Deduction quantity must be greater than zero.');
        }

        return DB::transaction(function () use (
            $warehouse,
            $inventoryItem,
            $quantity,
            $notes,
            $referenceType,
            $referenceId
        ) {
            $stock = InventoryStock::where('warehouse_id', $warehouse->id)
                ->where('inventory_item_id', $inventoryItem->id)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                throw new RuntimeException(
                    "No stock record exists for {$inventoryItem->name}."
                );
            }

            if ($stock->quantity < $quantity) {
                throw new RuntimeException(
                    "Insufficient stock for {$inventoryItem->name}."
                );
            }

            $stock->decrement('quantity', $quantity);

            InventoryTransaction::create([
                'warehouse_id' => $warehouse->id,
                'inventory_item_id' => $inventoryItem->id,
                'type' => 'sale',
                'quantity' => $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
            ]);

            return $stock->fresh();
        });
    }

    public function deductProduct(
        Warehouse $warehouse,
        \App\Models\Product $product,
        float $quantity,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): void {
        if ($quantity <= 0) {
            throw new RuntimeException(
                'Product quantity must be greater than zero.'
            );
        }

        $product->load('recipes.inventoryItem');

        if ($product->recipes->isEmpty()) {
            throw new RuntimeException(
                "Product {$product->name} has no recipe."
            );
        }

        DB::transaction(function () use (
            $warehouse,
            $product,
            $quantity,
            $referenceType,
            $referenceId
        ) {
            /*
            * Step 1:
            * Lock and validate ALL required inventory first.
            */
            $stocks = [];

            foreach ($product->recipes as $recipe) {
                $requiredQuantity = (float) $recipe->quantity * $quantity;

                $stock = InventoryStock::where('warehouse_id', $warehouse->id)
                    ->where('inventory_item_id', $recipe->inventory_item_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock) {
                    throw new RuntimeException(
                        "No stock record exists for {$recipe->inventoryItem->name}."
                    );
                }

                if ((float) $stock->quantity < $requiredQuantity) {
                    throw new RuntimeException(
                        "Insufficient stock for {$recipe->inventoryItem->name}. " .
                        "Required: {$requiredQuantity}, " .
                        "Available: {$stock->quantity}."
                    );
                }

                $stocks[] = [
                    'stock' => $stock,
                    'recipe' => $recipe,
                    'required_quantity' => $requiredQuantity,
                ];
            }

            /*
            * Step 2:
            * All ingredients are available.
            * Now perform the deductions.
            */
            foreach ($stocks as $data) {
                $stock = $data['stock'];
                $recipe = $data['recipe'];
                $requiredQuantity = $data['required_quantity'];

                $stock->decrement('quantity', $requiredQuantity);

                InventoryTransaction::create([
                    'warehouse_id' => $warehouse->id,
                    'inventory_item_id' => $recipe->inventory_item_id,
                    'type' => 'sale',
                    'quantity' => $requiredQuantity,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'notes' => "Product sale: {$product->name}",
                ]);
            }
        });
    }
}