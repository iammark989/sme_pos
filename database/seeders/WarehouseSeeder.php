<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::create([
            'branch_id' => null,
            'name' => 'Main Warehouse',
            'code' => 'MW-001',
            'type' => 'main',
            'is_active' => true,
        ]);

        Warehouse::create([
            'branch_id' => 1,
            'name' => 'Main Branch Warehouse',
            'code' => 'WH-001',
            'type' => 'branch',
            'is_active' => true,
        ]);
    }
}