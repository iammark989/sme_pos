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

        $query = User::query()
            ->with([
                'role',
                'branch',
            ]);

        // Owner and Global Admin can view all users.
        if (!$user->hasGlobalAccess()) {
            // Branch Admin can view their own account
            // and Accounting / Staff accounts assigned to their branch.
            $query->where(function ($query) use ($user) {
                $query->where('id', $user->id);

                if ($user->branch_id) {
                    $query->orWhere(function ($branchQuery) use ($user) {
                        $branchQuery
                            ->where('branch_id', $user->branch_id)
                            ->whereHas('role', function ($roleQuery) {
                                $roleQuery->whereIn('name', [
                                    'Accounting',
                                    'Staff',
                                ]);
                            });
                    });
                }
            });
        }

        $users = $query
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

        // Owner and Global Admin can view all users.
        if (!$user->hasGlobalAccess()) {
            $isOwnAccount = $managedUser->id === $user->id;

            $isBranchUser =
                $managedUser->branch_id === $user->branch_id
                && in_array(
                    $managedUser->role?->name,
                    ['Accounting', 'Staff'],
                    true
                );

            if (!$isOwnAccount && !$isBranchUser) {
                return response()->json([
                    'message' => 'You are not allowed to view this user.',
                ], 403);
            }
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
        $actorRole = $user->role?->name;
        $isOwner = $actorRole === 'Owner';
        $isGlobalAdmin = $user->hasGlobalAccess();

        if (!in_array($actorRole, ['Owner', 'Admin'], true)) {
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
            'is_active' => ['sometimes', 'boolean'],
            'is_global_admin' => ['sometimes', 'boolean'],
        ]);

        $role = Role::findOrFail($validated['role_id']);

        $isGlobalAdmin = $user->hasGlobalAccess();
        $isOwner = $actorRole === 'Owner';
        $requestedGlobalAdmin = $validated['is_global_admin'] ?? false;

        /*
        |--------------------------------------------------------------------------
        | Owner permissions
        |--------------------------------------------------------------------------
        */

        if ($isOwner) {
            // Only Owner can create another Owner.
            // Owner accounts cannot be Global Admin.
            if ($role->name === 'Owner' && $requestedGlobalAdmin) {
                return response()->json([
                    'message' => 'Owner accounts cannot have global admin access.',
                ], 422);
            }

            // Global Admin must be an Admin without branch assignment.
            if ($requestedGlobalAdmin && $role->name !== 'Admin') {
                return response()->json([
                    'message' => 'Only Admin users can have global admin access.',
                ], 422);
            }

            $branchId = $requestedGlobalAdmin
                ? null
                : ($validated['branch_id'] ?? null);

        /*
        |--------------------------------------------------------------------------
        | Global Admin permissions
        |--------------------------------------------------------------------------
        */

        } elseif ($isGlobalAdmin) {
            // Global Admin cannot create Owner or another Global Admin.
            if ($role->name === 'Owner' || $requestedGlobalAdmin) {
                return response()->json([
                    'message' => 'Global Admin cannot create Owner or Global Admin accounts.',
                ], 403);
            }

            // All created users must be assigned to a branch.
            if (empty($validated['branch_id'])) {
                return response()->json([
                    'message' => 'A branch is required for this role.',
                ], 422);
            }

            $branchId = $validated['branch_id'];

        /*
        |--------------------------------------------------------------------------
        | Branch Admin permissions
        |--------------------------------------------------------------------------
        */

        } else {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Admin is not assigned to a branch.',
                ], 403);
            }

            // Branch Admin can create only Accounting and Staff.
            if (!in_array($role->name, ['Accounting', 'Staff'], true)) {
                return response()->json([
                    'message' => 'Branch Admin can only create Accounting and Staff users.',
                ], 403);
            }

            if ($requestedGlobalAdmin) {
                return response()->json([
                    'message' => 'Branch Admin cannot grant global admin access.',
                ], 403);
            }

            // Always assign the Branch Admin's own branch.
            $branchId = $user->branch_id;
        }

        /*
        |--------------------------------------------------------------------------
        | Create user
        |--------------------------------------------------------------------------
        */

        $managedUser = User::create([
            'username' => $validated['username'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'suffix' => $validated['suffix'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'branch_id' => $branchId,
            'is_active' => $validated['is_active'] ?? true,
            'is_global_admin' => $isOwner && $requestedGlobalAdmin,
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

        $actorRole = $user->role?->name;
        $isOwner = $actorRole === 'Owner';
        $isGlobalAdmin = $actorRole === 'Admin' && $user->hasGlobalAccess();
        $targetRole = $managedUser->role?->name;

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to update users.',
            ], 403);
        }

        // Branch Admin can only manage users in their own branch.
        // Owner and Global Admin can manage users across all branches.
        if (
            $user->role?->name === 'Admin'
            && !$user->hasGlobalAccess()
            && $managedUser->id !== $user->id
            && $managedUser->branch_id !== $user->branch_id
        ) {
            return response()->json([
                'message' => 'You are not allowed to update this user.',
            ], 403);
        }

        $validated = $request->validate([
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

        $newIsGlobalAdmin = $validated['is_global_admin'] ?? $managedUser->is_global_admin;

         /*
        |--------------------------------------------------------------------------
        | Owner / Global Admin self-account protection
        |--------------------------------------------------------------------------
        */

        $isOwnAccount = $managedUser->id === $user->id;

        if ($isOwnAccount && ($isOwner || $isGlobalAdmin)) {
            $rules = [
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
            ];

            $validated = $request->validate($rules);

            $managedUser->first_name = $validated['first_name'];
            $managedUser->middle_name = $validated['middle_name'] ?? null;
            $managedUser->last_name = $validated['last_name'];
            $managedUser->suffix = $validated['suffix'] ?? null;
            $managedUser->email = $validated['email'];

            if (!empty($validated['password'])) {
                $managedUser->password = Hash::make($validated['password']);
            }

            $managedUser->save();

            $managedUser->load(['role', 'branch']);

            return response()->json([
                'message' => 'User updated successfully.',
                'data' => $managedUser,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Global Admin protection
        |--------------------------------------------------------------------------
        */

        // Global Admin cannot modify Owner or other Global Admin accounts.
        if (
            $isGlobalAdmin
            && (
                $targetRole === 'Owner'
                || $managedUser->is_global_admin
            )
        ) {
            return response()->json([
                'message' => 'Global Admin cannot modify Owner or Global Admin accounts.',
            ], 403);
        }

        
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
        $actorRole = $user->role?->name;
        $targetRole = $managedUser->role?->name;

        if (!in_array($actorRole, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to deactivate users.',
            ], 403);
        }

        $isOwner = $actorRole === 'Owner';
        $isGlobalAdmin = $user->hasGlobalAccess();
        $isBranchAdmin = $actorRole === 'Admin' && !$isGlobalAdmin;

        // Nobody can deactivate the Owner.
        if ($targetRole === 'Owner') {
            return response()->json([
                'message' => 'The Owner account cannot be deactivated.',
            ], 403);
        }

        // Nobody can deactivate their own account.
        if ($managedUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Global Admin restrictions
        |--------------------------------------------------------------------------
        */

        if ($isGlobalAdmin && $managedUser->is_global_admin) {
            return response()->json([
                'message' => 'Global Admin cannot deactivate another Global Admin.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Branch Admin restrictions
        |--------------------------------------------------------------------------
        */

        if ($isBranchAdmin) {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Admin is not assigned to a branch.',
                ], 403);
            }

            $isBranchStaff =
                $managedUser->branch_id === $user->branch_id
                && in_array($targetRole, ['Accounting', 'Staff'], true);

            if (!$isBranchStaff) {
                return response()->json([
                    'message' => 'Branch Admin can only deactivate Accounting and Staff users within their own branch.',
                ], 403);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Deactivate account
        |--------------------------------------------------------------------------
        */

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