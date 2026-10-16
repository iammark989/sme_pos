<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $fries = Category::where('slug', 'fries')->firstOrFail();
        $drinks = Category::where('slug', 'drinks')->firstOrFail();
        $addons = Category::where('slug', 'add-ons')->firstOrFail();

        $products = [
            [
                'category_id' => $fries->id,
                'name' => 'Small Fries BBQ',
                'sku' => 'FRIES-S-BBQ',
                'description' => 'Small fries with BBQ seasoning.',
                'selling_price' => 79.00,
            ],
            [
                'category_id' => $fries->id,
                'name' => 'Large Fries BBQ',
                'sku' => 'FRIES-L-BBQ',
                'description' => 'Large fries with BBQ seasoning.',
                'selling_price' => 99.00,
            ],
            [
                'category_id' => $fries->id,
                'name' => 'Small Fries Cheese',
                'sku' => 'FRIES-S-CHEESE',
                'description' => 'Small fries with cheese seasoning.',
                'selling_price' => 79.00,
            ],
            [
                'category_id' => $fries->id,
                'name' => 'Large Fries Cheese',
                'sku' => 'FRIES-L-CHEESE',
                'description' => 'Large fries with cheese seasoning.',
                'selling_price' => 99.00,
            ],
            [
                'category_id' => $drinks->id,
                'name' => 'Bottled Water',
                'sku' => 'DRINK-WATER',
                'description' => 'Bottled drinking water.',
                'selling_price' => 20.00,
            ],
            [
                'category_id' => $drinks->id,
                'name' => 'Canned Soda',
                'sku' => 'DRINK-SODA',
                'description' => 'Chilled canned soft drink.',
                'selling_price' => 35.00,
            ],
            [
                'category_id' => $addons->id,
                'name' => 'Extra Cheese Dip',
                'sku' => 'ADD-CHEESE-DIP',
                'description' => 'Extra serving of cheese dip.',
                'selling_price' => 15.00,
            ],
            [
                'category_id' => $addons->id,
                'name' => 'Ketchup Sachet',
                'sku' => 'ADD-KETCHUP',
                'description' => 'Single-serving ketchup sachet.',
                'selling_price' => 5.00,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['sku' => $product['sku']],
                [
                    'category_id' => $product['category_id'],
                    'name' => $product['name'],
                    'description' => $product['description'],
                    'selling_price' => $product['selling_price'],
                    'is_active' => true,
                ]
            );
        }
    }
}