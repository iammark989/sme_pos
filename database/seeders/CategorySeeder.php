<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Fries',
                'description' => 'French fries and flavored fries.',
            ],
            [
                'name' => 'Drinks',
                'description' => 'Bottled and canned beverages.',
            ],
            [
                'name' => 'Add-ons',
                'description' => 'Additional food items and extras.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
                'is_active' => true,
            ]);
        }
    }
}