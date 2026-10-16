<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::create([
            'name' => 'Pampanga Branch',
            'code' => 'BR-001',
            'address' => 'Pampanga',
            'contact_number' => '0123456789',
            'is_active' => true,
        ]);

        Branch::create([
            'name' => 'Manila Branch',
            'code' => 'BR-002',
            'address' => 'Manila',
            'contact_number' => '0123456789',
            'is_active' => true,
        ]);
    }
}