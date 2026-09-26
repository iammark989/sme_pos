<?php

namespace Database\Seeders;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\ProductRecipe;
use Illuminate\Database\Seeder;

class ProductRecipeSeeder extends Seeder
{
    public function run(): void
    {
        $smallFries = Product::where('sku', 'FRIES-S-BBQ')->firstOrFail();
        $largeFries = Product::where('sku', 'FRIES-L-BBQ')->firstOrFail();

        $potatoFries = InventoryItem::where('sku', 'INV-POTATO-FRIES')->firstOrFail();
        $bbqPowder = InventoryItem::where('sku', 'INV-BBQ-POWDER')->firstOrFail();
        $smallCup = InventoryItem::where('sku', 'INV-CUP-SMALL')->firstOrFail();
        $largeCup = InventoryItem::where('sku', 'INV-CUP-LARGE')->firstOrFail();

        $recipes = [
            // Small Fries BBQ
            [
                'product_id' => $smallFries->id,
                'inventory_item_id' => $potatoFries->id,
                'quantity' => 300,
            ],
            [
                'product_id' => $smallFries->id,
                'inventory_item_id' => $smallCup->id,
                'quantity' => 1,
            ],
            [
                'product_id' => $smallFries->id,
                'inventory_item_id' => $bbqPowder->id,
                'quantity' => 60,
            ],

            // Large Fries BBQ
            [
                'product_id' => $largeFries->id,
                'inventory_item_id' => $potatoFries->id,
                'quantity' => 500,
            ],
            [
                'product_id' => $largeFries->id,
                'inventory_item_id' => $largeCup->id,
                'quantity' => 1,
            ],
            [
                'product_id' => $largeFries->id,
                'inventory_item_id' => $bbqPowder->id,
                'quantity' => 100,
            ],
        ];

        foreach ($recipes as $recipe) {
            ProductRecipe::updateOrCreate(
                [
                    'product_id' => $recipe['product_id'],
                    'inventory_item_id' => $recipe['inventory_item_id'],
                ],
                [
                    'quantity' => $recipe['quantity'],
                ]
            );
        }
    }
}