<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory items.',
            ], 403);
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:all,active,inactive'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = InventoryItem::query()
            ->with('uom');

        $search = trim($validated['search'] ?? '');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'active';

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $inventoryItems = $query
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => $inventoryItems,
        ]);
    }

    public function show(
        Request $request,
        InventoryItem $inventoryItem
    ): JsonResponse {
         $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view inventory items.',
            ], 403);
        }

        $inventoryItem->load('uom');

        return response()->json([
            'data' => [
                'inventory_item' => $inventoryItem,
            ],
        ]);
    }

    
    public function updateStatus(
        Request $request,
        InventoryItem $inventoryItem
    ): JsonResponse {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to change inventory item status.',
            ], 403);
        }

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $inventoryItem->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => $inventoryItem->is_active
                ? 'Inventory item activated successfully.'
                : 'Inventory item deactivated successfully.',
            'data' => $inventoryItem->load('uom'),
        ]);
    }

    
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to create inventory items.',
            ], 403);
        }

        $validated = $request->validate([
            'uom_id' => ['required', 'integer', 'exists:uoms,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:255', 'unique:inventory_items,sku'],
            'description' => ['nullable', 'string'],
            'reorder_level' => ['required', 'numeric', 'min:0', 'decimal:0,3'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $uom = \App\Models\Uom::findOrFail($validated['uom_id']);

        if (!$uom->is_active) {
            return response()->json([
                'message' => 'Please select an active unit of measure.',
            ], 422);
        }

        $inventoryItem = InventoryItem::create($validated);

        return response()->json([
            'message' => 'Inventory item created successfully.',
            'data' => $inventoryItem->load('uom'),
        ], 201);
    }

    
    public function update(
        Request $request,
        InventoryItem $inventoryItem
    ): JsonResponse {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to update inventory items.',
            ], 403);
        }

        $validated = $request->validate([
            'uom_id' => ['sometimes', 'required', 'integer', 'exists:uoms,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique(
                    'inventory_items',
                    'sku'
                )->ignore($inventoryItem->id),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'reorder_level' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['uom_id'])) {
            $uom = \App\Models\Uom::findOrFail($validated['uom_id']);

            if (!$uom->is_active) {
                return response()->json([
                    'message' => 'Please select an active unit of measure.',
                ], 422);
            }
        }

        $inventoryItem->update($validated);

        return response()->json([
            'message' => 'Inventory item updated successfully.',
            'data' => $inventoryItem->fresh()->load('uom'),
        ]);
    }


}