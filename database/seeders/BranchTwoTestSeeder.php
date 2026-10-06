<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class BranchTwoTestSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'Admin')->firstOrFail();

        $branch = Branch::updateOrCreate(
            ['code' => 'BR-002'],
            [
                'name' => 'Test Branch 2',
                'address' => 'San Fernando, Pampanga',
                'contact_number' => null,
                'is_active' => true,
            ]
        );

        Warehouse::updateOrCreate(
            ['code' => 'WH-002'],
            [
                'branch_id' => $branch->id,
                'name' => 'Test Branch 2 Warehouse',
                'type' => 'branch',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['username' => 'testadmin2'],
            [
                'first_name' => 'Test',
                'middle_name' => null,
                'last_name' => 'Admin 2',
                'suffix' => null,
                'email' => 'testadmin2@example.com',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'branch_id' => $branch->id,
                'is_active' => true,
            ]
        );
    }
}