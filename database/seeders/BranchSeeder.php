<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        Branch::create([
            'name' => 'Main Branch',
            'code' => 'BR-001',
            'address' => null,
            'contact_number' => null,
            'is_active' => true,
        ]);
    }
}