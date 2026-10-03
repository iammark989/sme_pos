<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOrderQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
       
        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view purchase orders.',
            ], 403);
        }

        $purchaseOrders = PurchaseOrder::query()
            ->with([
                'supplier',
                'warehouse',
                'user',
                'items.inventoryItem.uom',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where(function ($query) use ($user) {
                    if ($user->role?->name === 'Owner') {
                        return;
                    }

                    $query->where('branch_id', $user->branch_id);
                });
            })
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $purchaseOrders,
        ]);
    }

    public function show(
        Request $request,
        PurchaseOrder $purchaseOrder
    ): JsonResponse {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view purchase orders.',
            ], 403);
        }

        if (
                $user->role?->name !== 'Owner'
                && $purchaseOrder->warehouse->branch_id !== $user->branch_id
            ) {
            return response()->json([
                'message' => 'You are not allowed to view this purchase order.',
            ], 403);
        }

        $purchaseOrder->load([
            'supplier',
            'warehouse',
            'user',
            'items.inventoryItem.uom',
        ]);

        return response()->json([
            'data' => [
                'purchase_order' => $purchaseOrder,
            ],
        ]);
    }

    public function receivable(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view receivable purchase orders.',
            ], 403);
        }

        $purchaseOrders = PurchaseOrder::query()
            ->with([
                'supplier',
                'warehouse',
                'user',
                'items.inventoryItem.uom',
            ])
            ->whereIn('status', [
                'submitted',
                'partially_received',
            ])
            ->whereHas('warehouse', function ($query) use ($user) {
                $query->where(function ($query) use ($user) {
                    if ($user->role?->name === 'Owner') {
                        return;
                    }

                    $query->where('branch_id', $user->branch_id);
                });
            })
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $purchaseOrders,
        ]);
    }

}