<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchManagementController extends Controller
{
    private function authorizeManagement(Request $request): void
    {
        $user = $request->user();

        abort_unless(
            $user && in_array($user->role?->name, ['Owner', 'Admin'], true),
            403,
            'You are not authorized to manage branches.'
        );

        // Only Owners and Global Admins may manage
        // the branch structure across the business.
        abort_unless(
            $user->role?->name === 'Owner' || $user->is_global_admin,
            403,
            'Only Owners or Global Admins can manage branches.'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        $branches = Branch::query()
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $branches,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:branches,code'],
            'address' => ['nullable', 'string', 'max:1000'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $branch = Branch::create($validated);

        return response()->json([
            'message' => 'Branch created successfully.',
            'data' => $branch,
        ], 201);
    }

    public function show(Request $request, Branch $branch): JsonResponse
    {
        $this->authorizeManagement($request);

        return response()->json([
            'data' => $branch,
        ]);
    }

    public function update(
        Request $request,
        Branch $branch
    ): JsonResponse {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('branches', 'code')->ignore($branch->id),
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $branch->update($validated);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'data' => $branch->fresh(),
        ]);
    }

    
    public function updateStatus(
        Request $request,
        Branch $branch
    ): JsonResponse {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        // Prevent deactivation while the branch has an open shift.
        if (
            !$validated['is_active'] &&
            Shift::where('branch_id', $branch->id)
                ->where('status', 'open')
                ->exists()
        ) {
            return response()->json([
                'message' => 'This branch cannot be deactivated while it has open shifts. Close all open shifts first.',
            ], 422);
        }

        $branch->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => $validated['is_active']
                ? 'Branch activated successfully.'
                : 'Branch deactivated successfully.',
            'data' => $branch->fresh(),
        ]);
    }

}