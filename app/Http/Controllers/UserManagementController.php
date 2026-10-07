<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access user management.',
            ], 403);
        }

        $users = User::query()
            ->with([
                'role',
                'branch',
            ])
            ->when(
                !$user->hasGlobalAccess(),
                fn ($query) => $query->where('branch_id', $user->branch_id)
            )
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $users,
        ]);
    }

    public function show(Request $request, User $managedUser): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to view users.',
            ], 403);
        }

        if (
            !$user->hasGlobalAccess()
            && $managedUser->branch_id !== $user->branch_id
        ) {
            return response()->json([
                'message' => 'You are not allowed to view this user.',
            ], 403);
        }

        $managedUser->load([
            'role',
            'branch',
        ]);

        return response()->json([
            'data' => $managedUser,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to create users.',
            ], 403);
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'is_global_admin' => ['boolean'],
        ]);

        $role = Role::findOrFail($validated['role_id']);

        // Only Owner can create an Owner.
        if (
            $role->name === 'Owner'
            && $user->role?->name !== 'Owner'
        ) {
            return response()->json([
                'message' => 'Only the Owner can create an Owner account.',
            ], 403);
        }

        // Admin can only create users within their own branch.
        if ($user->role?->name === 'Admin') {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Admin is not assigned to a branch.',
                ], 403);
            }

            if (
                $role->name === 'Owner'
                || !isset($validated['branch_id'])
                || (int) $validated['branch_id'] !== (int) $user->branch_id
                || ($validated['is_global_admin'] ?? false)
            ) {
                return response()->json([
                    'message' => 'Admin can only create users within their own branch.',
                ], 403);
            }
        }

        // Non-owner users should always belong to a branch.
        if (
            $role->name !== 'Owner'
            && $role->name !== 'Admin'
            && empty($validated['branch_id'])
        ) {
            return response()->json([
                'message' => 'A branch is required for this role.',
            ], 422);
        }

        if (
            $role->name === 'Admin'
            && !($validated['is_global_admin'] ?? false)
            && empty($validated['branch_id'])
        ) {
            return response()->json([
                'message' => 'A branch is required for a branch-scoped Admin.',
            ], 422);
        }

        $managedUser = User::create([
            'username' => $validated['username'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'suffix' => $validated['suffix'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_global_admin' => $validated['is_global_admin'] ?? false,
        ]);

        $managedUser->load([
            'role',
            'branch',
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $managedUser,
        ], 201);
    }

    public function update(Request $request, User $managedUser): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to update users.',
            ], 403);
        }

        // Branch Admin can only manage users in their own branch.
        // Owner and Global Admin can manage users across all branches.
        if (
            !$user->hasGlobalAccess()
            && $managedUser->branch_id !== $user->branch_id
        ) {
            return response()->json([
                'message' => 'You are not allowed to update this user.',
            ], 403);
        }

        $validated = $request->validate([
            'username' => [
                'required',
                'string',
                'max:100',
                Rule::unique('users', 'username')->ignore($managedUser->id),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($managedUser->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'is_global_admin' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $newRole = Role::findOrFail($validated['role_id']);

        $newIsGlobalAdmin = $validated['is_global_admin'] ?? false;

        /*
        |--------------------------------------------------------------------------
        | Owner protection
        |--------------------------------------------------------------------------
        */

        // Admin — including Global Admin — cannot modify an Owner.
        if (
            $user->role?->name === 'Admin'
            && $managedUser->role?->name === 'Owner'
        ) {
            return response()->json([
                'message' => 'Admin cannot modify an Owner account.',
            ], 403);
        }

        // Admin cannot promote anyone to Owner.
        if (
            $user->role?->name === 'Admin'
            && $newRole->name === 'Owner'
        ) {
            return response()->json([
                'message' => 'Admin cannot assign the Owner role.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Global Admin protection
        |--------------------------------------------------------------------------
        */

        // Only Owner can create/enable Global Admin access.
        if (
            $newIsGlobalAdmin
            && $newRole->name !== 'Admin'
        ) {
            return response()->json([
                'message' => 'Only Admin users can have global admin access.',
            ], 422);
        }

        if (
            $newIsGlobalAdmin
            && $user->role?->name !== 'Owner'
        ) {
            return response()->json([
                'message' => 'Only the Owner can assign global admin access.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Branch assignment
        |--------------------------------------------------------------------------
        */

        // Global Admin must not belong to a specific branch.
        if ($newIsGlobalAdmin) {
            $validated['branch_id'] = null;
        }

        // A normal Admin must belong to a branch.
        if (
            $newRole->name === 'Admin'
            && !$newIsGlobalAdmin
            && empty($validated['branch_id'])
        ) {
            return response()->json([
                'message' => 'A branch is required for a branch-scoped Admin.',
            ], 422);
        }

        // Non-Owner, non-Global-Admin users require a branch.
        if (
            $newRole->name !== 'Owner'
            && !$newIsGlobalAdmin
            && empty($validated['branch_id'])
        ) {
            return response()->json([
                'message' => 'A branch is required for this role.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Branch Admin restriction
        |--------------------------------------------------------------------------
        */

        // Normal Branch Admin cannot move users to another branch
        // or enable Global Admin access.
        if ($user->role?->name === 'Admin' && !$user->is_global_admin) {
            if (
                $newIsGlobalAdmin
                || empty($validated['branch_id'])
                || (int) $validated['branch_id'] !== (int) $user->branch_id
            ) {
                return response()->json([
                    'message' => 'Admin can only manage users within their own branch.',
                ], 403);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Save
        |--------------------------------------------------------------------------
        */

        $managedUser->username = $validated['username'];
        $managedUser->first_name = $validated['first_name'];
        $managedUser->middle_name = $validated['middle_name'] ?? null;
        $managedUser->last_name = $validated['last_name'];
        $managedUser->suffix = $validated['suffix'] ?? null;
        $managedUser->email = $validated['email'];
        $managedUser->role_id = $validated['role_id'];
        $managedUser->branch_id = $validated['branch_id'] ?? null;
        $managedUser->is_global_admin = $newIsGlobalAdmin;
        $managedUser->is_active = $validated['is_active'] ?? $managedUser->is_active;

        if (!empty($validated['password'])) {
            $managedUser->password = Hash::make($validated['password']);
        }

        $managedUser->save();

        $managedUser->load([
            'role',
            'branch',
        ]);

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $managedUser,
        ]);
    }

    public function destroy(Request $request, User $managedUser): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to deactivate users.',
            ], 403);
        }

        // Branch Admin can only manage users in their own branch.
        // Owner and Global Admin can manage users across all branches.
        if (
            !$user->hasGlobalAccess()
            && $managedUser->branch_id !== $user->branch_id
        ) {
            return response()->json([
                'message' => 'You are not allowed to deactivate this user.',
            ], 403);
        }

        // Nobody can deactivate the Owner.
        if ($managedUser->role?->name === 'Owner') {
            return response()->json([
                'message' => 'The Owner account cannot be deactivated.',
            ], 403);
        }

        // Prevent a user from deactivating their own account.
        if ($managedUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        $managedUser->is_active = false;
        $managedUser->save();

        return response()->json([
            'message' => 'User deactivated successfully.',
            'data' => $managedUser->fresh([
                'role',
                'branch',
            ]),
        ]);
    }
}