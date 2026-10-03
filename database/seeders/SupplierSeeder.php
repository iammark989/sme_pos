<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::updateOrCreate(
            ['code' => 'SUP-001'],
            [
                'name' => 'Pampanga Food Supply',
                'contact_person' => 'Juan Dela Cruz',
                'contact_number' => '09171234567',
                'email' => 'pampangasupply@example.com',
                'address' => 'Angeles City, Pampanga',
                'is_active' => true,
            ]
        );

        Supplier::updateOrCreate(
            ['code' => 'SUP-002'],
            [
                'name' => 'Central Luzon Packaging Supply',
                'contact_person' => 'Maria Santos',
                'contact_number' => '09181234567',
                'email' => 'packaging@example.com',
                'address' => 'San Fernando, Pampanga',
                'is_active' => true,
            ]
        );
    }
}