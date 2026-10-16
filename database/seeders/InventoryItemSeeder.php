<?php

namespace Database\Seeders;

use App\Models\InventoryItem;
use App\Models\Uom;
use Illuminate\Database\Seeder;

class InventoryItemSeeder extends Seeder
{
    public function run(): void
    {
        $gram = Uom::where('abbreviation', 'g')->firstOrFail();
        $piece = Uom::where('abbreviation', 'pc')->firstOrFail();

        $items = [
            [
                'name' => 'Potato Fries',
                'sku' => 'INV-POTATO-FRIES',
                'uom_id' => $gram->id,
                'reorder_level' => 10000,
            ],
            [
                'name' => 'BBQ Powder',
                'sku' => 'INV-BBQ-POWDER',
                'uom_id' => $gram->id,
                'reorder_level' => 2000,
            ],
            [
                'name' => 'Large Fries Cup',
                'sku' => 'INV-CUP-LARGE',
                'uom_id' => $piece->id,
                'reorder_level' => 50,
            ],
            [
                'name' => 'Small Fries Cup',
                'sku' => 'INV-CUP-SMALL',
                'uom_id' => $piece->id,
                'reorder_level' => 50,
            ],
            [
                'name' => 'Cooking Oil',
                'sku' => 'INV-COOKING-OIL',
                'uom_id' => $gram->id,
                'reorder_level' => 5000,
            ],

            // Additional inventory items
            [
                'name' => 'Cheese Powder',
                'sku' => 'INV-CHEESE-POWDER',
                'uom_id' => $gram->id,
                'reorder_level' => 2000,
            ],
            [
                'name' => 'Bottled Water',
                'sku' => 'INV-BOTTLED-WATER',
                'uom_id' => $piece->id,
                'reorder_level' => 24,
            ],
            [
                'name' => 'Canned Soda',
                'sku' => 'INV-CANNED-SODA',
                'uom_id' => $piece->id,
                'reorder_level' => 24,
            ],
            [
                'name' => 'Cheese Dip',
                'sku' => 'INV-CHEESE-DIP',
                'uom_id' => $gram->id,
                'reorder_level' => 1000,
            ],
            [
                'name' => 'Ketchup Sachet',
                'sku' => 'INV-KETCHUP-SACHET',
                'uom_id' => $piece->id,
                'reorder_level' => 50,
            ],
            [
                'name' => 'Sour Cream Powder',
                'sku' => 'INV-SOUR-CREAM',
                'uom_id' => $gram->id,
                'reorder_level' => 2000,
            ],
        ];

        foreach ($items as $item) {
            InventoryItem::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'name' => $item['name'],
                    'uom_id' => $item['uom_id'],
                    'reorder_level' => $item['reorder_level'],
                    'is_active' => true,
                ]
            );
        }
    }
}
