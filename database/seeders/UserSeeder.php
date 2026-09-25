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

        User::create([
            'username' => 'owner',
            'first_name' => 'System',
            'middle_name' => null,
            'last_name' => 'Owner',
            'suffix' => null,
            'email' => 'owner@example.com',
            'password' => 'password',
            'role_id' => $ownerRole->id,
            'branch_id' => null,
            'is_active' => true,
        ]);
    }
}