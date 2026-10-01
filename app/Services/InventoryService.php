<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\Sale;
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

    public function transferStock(
        Warehouse $sourceWarehouse,
        Warehouse $destinationWarehouse,
        InventoryItem $inventoryItem,
        float $quantity,
        ?string $notes = null
    ): array {
        if ($quantity <= 0) {
            throw new RuntimeException(
                'Transfer quantity must be greater than zero.'
            );
        }

        if ($sourceWarehouse->id === $destinationWarehouse->id) {
            throw new RuntimeException(
                'Source and destination warehouses must be different.'
            );
        }

        return DB::transaction(function () use (
            $sourceWarehouse,
            $destinationWarehouse,
            $inventoryItem,
            $quantity,
            $notes
        ) {
            /*
            * Generate one reference for the entire transfer.
            *
            * Both transfer_out and transfer_in transactions
            * will use this same reference.
            */
            $transferReference =
                'TRF-' .
                now()->format('YmdHis') .
                '-' .
                strtoupper(str()->random(4));

            /*
            * Lock both stock records before making any changes.
            *
            * This prevents two simultaneous transfers from
            * using the same available stock.
            */

            $sourceStock = InventoryStock::where('warehouse_id', $sourceWarehouse->id)
                ->where('inventory_item_id', $inventoryItem->id)
                ->lockForUpdate()
                ->first();

            if (!$sourceStock) {
                throw new RuntimeException(
                    "No stock record exists for {$inventoryItem->name} in {$sourceWarehouse->name}."
                );
            }

            if ((float) $sourceStock->quantity < $quantity) {
                throw new RuntimeException(
                    "Insufficient stock for {$inventoryItem->name}. " .
                    "Required: {$quantity}, " .
                    "Available: {$sourceStock->quantity}."
                );
            }

            $destinationStock = InventoryStock::where('warehouse_id', $destinationWarehouse->id)
                ->where('inventory_item_id', $inventoryItem->id)
                ->lockForUpdate()
                ->first();

            if (!$destinationStock) {
                $destinationStock = InventoryStock::create([
                    'warehouse_id' => $destinationWarehouse->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 0,
                ]);
            }

            /*
            * Deduct from source.
            */
            $sourceStock->decrement('quantity', $quantity);

            /*
            * Add to destination.
            */
            $destinationStock->increment('quantity', $quantity);

            /*
            * Record transfer-out movement.
            */
            InventoryTransaction::create([
                'warehouse_id' => $sourceWarehouse->id,
                'inventory_item_id' => $inventoryItem->id,
                'type' => 'transfer_out',
                'transfer_reference' => $transferReference,
                'quantity' => $quantity,
                'notes' => $notes,
            ]);

            /*
            * Record transfer-in movement.
            */
            InventoryTransaction::create([
                'warehouse_id' => $destinationWarehouse->id,
                'inventory_item_id' => $inventoryItem->id,
                'type' => 'transfer_in',
                'transfer_reference' => $transferReference,
                'quantity' => $quantity,
                'notes' => $notes,
            ]);

            return [
                'transfer_reference' => $transferReference,
                'source_stock' => $sourceStock->fresh(),
                'destination_stock' => $destinationStock->fresh(),
            ];
        });
    }

    public function adjustStock(
        Warehouse $warehouse,
        InventoryItem $inventoryItem,
        string $adjustmentType,
        float $quantity,
        ?string $notes = null
    ): InventoryStock {
        if (!in_array($adjustmentType, ['increase', 'decrease'], true)) {
            throw new RuntimeException(
                'Adjustment type must be increase or decrease.'
            );
        }

        if ($quantity <= 0) {
            throw new RuntimeException(
                'Adjustment quantity must be greater than zero.'
            );
        }

        return DB::transaction(function () use (
            $warehouse,
            $inventoryItem,
            $adjustmentType,
            $quantity,
            $notes
        ) {
            $stock = InventoryStock::where('warehouse_id', $warehouse->id)
                ->where('inventory_item_id', $inventoryItem->id)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                if ($adjustmentType === 'decrease') {
                    throw new RuntimeException(
                        "No stock record exists for {$inventoryItem->name}."
                    );
                }

                $stock = InventoryStock::create([
                    'warehouse_id' => $warehouse->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 0,
                ]);
            }

            if ($adjustmentType === 'decrease') {
                if ((float) $stock->quantity < $quantity) {
                    throw new RuntimeException(
                        "Insufficient stock for {$inventoryItem->name}. " .
                        "Required: {$quantity}, " .
                        "Available: {$stock->quantity}."
                    );
                }

                $stock->decrement('quantity', $quantity);
            } else {
                $stock->increment('quantity', $quantity);
            }

            InventoryTransaction::create([
                'warehouse_id' => $warehouse->id,
                'inventory_item_id' => $inventoryItem->id,
                'type' => 'adjustment',
                'quantity' => $adjustmentType === 'increase'
                    ? $quantity
                    : -$quantity,
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

    public function reverseSale(
        Sale $sale,
        ?string $notes = null,
    ): void {
        $sale->loadMissing([
            'items.product.recipes',
        ]);

        foreach ($sale->items as $item) {
            $quantitySold = (float) $item->quantity;

            foreach ($item->product->recipes as $recipe) {
                $quantityToRestore =
                    (float) $recipe->quantity * $quantitySold;

                $stock = InventoryStock::query()
                    ->where('warehouse_id', $sale->warehouse_id)
                    ->where(
                        'inventory_item_id',
                        $recipe->inventory_item_id
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$stock) {
                    $stock = InventoryStock::create([
                        'warehouse_id' => $sale->warehouse_id,
                        'inventory_item_id' => $recipe->inventory_item_id,
                        'quantity' => 0,
                    ]);
                }

                $stock->increment(
                    'quantity',
                    $quantityToRestore
                );

                InventoryTransaction::create([
                    'warehouse_id' => $sale->warehouse_id,
                    'inventory_item_id' => $recipe->inventory_item_id,
                    'type' => 'sale_reversal',
                    'quantity' => $quantityToRestore,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'notes' => $notes,
                ]);
            }
        }
    }
}