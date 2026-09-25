<?php

namespace Database\Seeders;

use App\Models\Uom;
use Illuminate\Database\Seeder;

class UomSeeder extends Seeder
{
    public function run(): void
    {
        $uoms = [
            [
                'name' => 'Piece',
                'abbreviation' => 'pc',
                'type' => 'count',
            ],
            [
                'name' => 'Gram',
                'abbreviation' => 'g',
                'type' => 'weight',
            ],
            [
                'name' => 'Kilogram',
                'abbreviation' => 'kg',
                'type' => 'weight',
            ],
            [
                'name' => 'Milliliter',
                'abbreviation' => 'ml',
                'type' => 'volume',
            ],
            [
                'name' => 'Liter',
                'abbreviation' => 'L',
                'type' => 'volume',
            ],
        ];

        foreach ($uoms as $uom) {
            Uom::create($uom);
        }
    }
}