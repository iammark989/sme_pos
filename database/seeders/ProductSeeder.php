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