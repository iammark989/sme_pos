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
        $recipes = [
            // Small Fries BBQ
            [
                'product' => 'FRIES-S-BBQ',
                'inventory' => 'INV-POTATO-FRIES',
                'quantity' => 300,
            ],
            [
                'product' => 'FRIES-S-BBQ',
                'inventory' => 'INV-CUP-SMALL',
                'quantity' => 1,
            ],
            [
                'product' => 'FRIES-S-BBQ',
                'inventory' => 'INV-BBQ-POWDER',
                'quantity' => 60,
            ],

            // Large Fries BBQ
            [
                'product' => 'FRIES-L-BBQ',
                'inventory' => 'INV-POTATO-FRIES',
                'quantity' => 500,
            ],
            [
                'product' => 'FRIES-L-BBQ',
                'inventory' => 'INV-CUP-LARGE',
                'quantity' => 1,
            ],
            [
                'product' => 'FRIES-L-BBQ',
                'inventory' => 'INV-BBQ-POWDER',
                'quantity' => 100,
            ],

            // Small Fries Cheese
            [
                'product' => 'FRIES-S-CHEESE',
                'inventory' => 'INV-POTATO-FRIES',
                'quantity' => 300,
            ],
            [
                'product' => 'FRIES-S-CHEESE',
                'inventory' => 'INV-CUP-SMALL',
                'quantity' => 1,
            ],
            [
                'product' => 'FRIES-S-CHEESE',
                'inventory' => 'INV-CHEESE-POWDER',
                'quantity' => 60,
            ],

            // Large Fries Cheese
            [
                'product' => 'FRIES-L-CHEESE',
                'inventory' => 'INV-POTATO-FRIES',
                'quantity' => 500,
            ],
            [
                'product' => 'FRIES-L-CHEESE',
                'inventory' => 'INV-CUP-LARGE',
                'quantity' => 1,
            ],
            [
                'product' => 'FRIES-L-CHEESE',
                'inventory' => 'INV-CHEESE-POWDER',
                'quantity' => 100,
            ],

            // Bottled Water
            [
                'product' => 'DRINK-WATER',
                'inventory' => 'INV-BOTTLED-WATER',
                'quantity' => 1,
            ],

            // Canned Soda
            [
                'product' => 'DRINK-SODA',
                'inventory' => 'INV-CANNED-SODA',
                'quantity' => 1,
            ],

            // Extra Cheese Dip
            [
                'product' => 'ADD-CHEESE-DIP',
                'inventory' => 'INV-CHEESE-DIP',
                'quantity' => 50,
            ],

            // Ketchup Sachet
            [
                'product' => 'ADD-KETCHUP',
                'inventory' => 'INV-KETCHUP-SACHET',
                'quantity' => 1,
            ],
        ];

        foreach ($recipes as $recipe) {
            $product = Product::where(
                'sku',
                $recipe['product']
            )->firstOrFail();

            $inventoryItem = InventoryItem::where(
                'sku',
                $recipe['inventory']
            )->firstOrFail();

            ProductRecipe::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'inventory_item_id' => $inventoryItem->id,
                ],
                [
                    'quantity' => $recipe['quantity'],
                ]
            );
        }
    }
}