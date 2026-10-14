<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarehouseManagementController extends Controller
{
    private function authorizeManagement(Request $request): void
    {
        $user = $request->user();

        abort_unless(
            $user &&
                in_array($user->role?->name, ['Owner', 'Admin'], true),
            403,
            'You are not authorized to manage warehouses.'
        );

        abort_unless(
            $user->role?->name === 'Owner' ||
                $user->is_global_admin,
            403,
            'Only Owners or Global Admins can manage warehouses.'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        $warehouses = Warehouse::query()
            ->with('branch:id,name,code')
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $warehouses,
        ]);
    }

    
    public function store(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:255',
                'unique:warehouses,code',
            ],
            'type' => [
                'required',
                Rule::in(['main', 'branch']),
            ],
            'branch_id' => [
                'nullable',
                'integer',
                'exists:branches,id',
            ],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $warehouse = Warehouse::create($validated);

        $warehouse->load('branch:id,name,code');

        return response()->json([
            'message' => 'Warehouse created successfully.',
            'data' => $warehouse,
        ], 201);
    }

    
    public function show(
        Request $request,
        Warehouse $warehouse
    ): JsonResponse {
        $this->authorizeManagement($request);

        $warehouse->load('branch:id,name,code');

        return response()->json([
            'data' => $warehouse,
        ]);
    }

    public function update(
        Request $request,
        Warehouse $warehouse
    ): JsonResponse {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('warehouses', 'code')->ignore($warehouse->id),
            ],
            'type' => [
                'sometimes',
                'required',
                Rule::in(['main', 'branch']),
            ],
            'branch_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:branches,id',
            ],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $warehouse->update($validated);
        $warehouse->load('branch:id,name,code');

        return response()->json([
            'message' => 'Warehouse updated successfully.',
            'data' => $warehouse->fresh()->load('branch:id,name,code'),
        ]);
    }

    
    public function updateStatus(
        Request $request,
        Warehouse $warehouse
    ): JsonResponse {
        $this->authorizeManagement($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if (!$validated['is_active']) {
            if (
                $warehouse->shifts()
                    ->where('status', 'open')
                    ->exists()
            ) {
                return response()->json([
                    'message' => 'This warehouse cannot be deactivated while it has open shifts. Close all open shifts first.',
                ], 422);
            }

            if (
                $warehouse->inventoryStocks()
                    ->where('quantity', '>', 0)
                    ->exists()
            ) {
                return response()->json([
                    'message' => 'This warehouse cannot be deactivated while it has inventory stock. Transfer or otherwise resolve the remaining stock first.',
                ], 422);
            }
        }

        $warehouse->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => $validated['is_active']
                ? 'Warehouse activated successfully.'
                : 'Warehouse deactivated successfully.',
            'data' => $warehouse->fresh()->load('branch:id,name,code'),
        ]);
    }



}