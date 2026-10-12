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

}