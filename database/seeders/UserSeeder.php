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
            ['username' => 'generalmanager'],
            [
                'first_name' => 'General',
                'middle_name' => null,
                'last_name' => 'Manager',
                'suffix' => null,
                'email' => 'generalmanager@example.com',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'branch_id' => 1,
                'is_active' => true,
                'is_global_admin' => true,
            ]
        );

        // Pampanga Admin
        User::updateOrCreate(
            ['username' => 'pampangaadmin'],
            [
                'first_name' => 'Pampanga',
                'middle_name' => null,
                'last_name' => 'Admin',
                'suffix' => null,
                'email' => 'pampangaadmin@example.com',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'branch_id' => 1,
                'is_active' => true,
                'is_global_admin' => true,
            ]
        );

        // Admin
        User::updateOrCreate(
            ['username' => 'manilaadmin'],
            [
                'first_name' => 'Manila',
                'middle_name' => null,
                'last_name' => 'Manager',
                'suffix' => null,
                'email' => 'manilaadmin@example.com',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'branch_id' => 2,
                'is_active' => true,
                'is_global_admin' => true,
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
                'is_global_admin' => false,
            ]
        );

        // Pampanga Staff
        User::updateOrCreate(
            ['username' => 'pampangastaff'],
            [
                'first_name' => 'Pampanga',
                'middle_name' => null,
                'last_name' => 'Staff',
                'suffix' => null,
                'email' => 'pampangastraff@example.com',
                'password' => 'password',
                'role_id' => $staffRole->id,
                'branch_id' => 1,
                'is_active' => true,
                'is_global_admin' => false,
            ]
        );

         // Manila Staff
        User::updateOrCreate(
            ['username' => 'manilastaff'],
            [
                'first_name' => 'Manila',
                'middle_name' => null,
                'last_name' => 'Staff',
                'suffix' => null,
                'email' => 'manilastaff@example.com',
                'password' => 'password',
                'role_id' => $staffRole->id,
                'branch_id' => 2,
                'is_active' => true,
                'is_global_admin' => false,
            ]
        );
    }
}