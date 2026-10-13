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

}