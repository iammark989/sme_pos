<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\PurchaseOrder;
use App\Models\Warehouse;
use App\Services\GoodsReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class GoodsReceiptController extends Controller
{
    public function __construct(
        protected GoodsReceiptService $goodsReceiptService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_order_id' => [
                'required',
                'integer',
                'exists:purchase_orders,id',
            ],
            'warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],
            'received_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => [
                'required',
                'integer',
                'exists:inventory_items,id',
            ],
            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],
            'items.*.unit_cost' => [
                'nullable',
                'numeric',
                'gte:0',
            ],
        ]);

        $user = $request->user();

        $purchaseOrder = PurchaseOrder::findOrFail(
            $validated['purchase_order_id']
        );

        $warehouse = Warehouse::findOrFail(
            $validated['warehouse_id']
        );

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to receive goods.',
            ], 403);
        }

        try {
            $goodsReceipt = $this->goodsReceiptService->create(
                purchaseOrder: $purchaseOrder,
                warehouse: $warehouse,
                user: $user,
                items: $validated['items'],
                receivedDate: $validated['received_date'],
                notes: $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Goods receipt created successfully.',
                'data' => [
                    'goods_receipt' => $goodsReceipt,
                ],
            ], 201);
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}