<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $ownerRole = Role::where('name', 'Owner')->firstOrFail();
        $adminRole = Role::where('name', 'Admin')->firstOrFail();
        $accountingRole = Role::where('name', 'Accounting')->firstOrFail();
        $staffRole = Role::where('name', 'Staff')->firstOrFail();

        // Owner
        User::updateOrCreate(
            ['username' => 'owner'],
            [
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'Owner',
                'suffix' => null,
                'email' => 'owner@example.com',
                'password' => 'password',
                'role_id' => $ownerRole->id,
                'branch_id' => null,
                'is_active' => true,
            ]
        );

        // Admin
        User::updateOrCreate(
            ['username' => 'testadmin'],
            [
                'first_name' => 'Test',
                'middle_name' => null,
                'last_name' => 'Admin',
                'suffix' => null,
                'email' => 'testadmin@example.com',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'branch_id' => 1,
                'is_active' => true,
            ]
        );

        // Accounting
        User::updateOrCreate(
            ['username' => 'testaccounting'],
            [
                'first_name' => 'Test',
                'middle_name' => null,
                'last_name' => 'Accounting',
                'suffix' => null,
                'email' => 'testaccounting@example.com',
                'password' => 'password',
                'role_id' => $accountingRole->id,
                'branch_id' => 1,
                'is_active' => true,
            ]
        );

        // Staff
        User::updateOrCreate(
            ['username' => 'teststaff'],
            [
                'first_name' => 'Test',
                'middle_name' => null,
                'last_name' => 'Staff',
                'suffix' => null,
                'email' => 'teststaff@example.com',
                'password' => 'password',
                'role_id' => $staffRole->id,
                'branch_id' => 1,
                'is_active' => true,
            ]
        );
    }
}