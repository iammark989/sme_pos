<?php

namespace App\Http\Controllers;

use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'payment_method' => [
                'required',
                'string',
                'in:cash,gcash',
            ],

            'amount_paid' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'payment_reference' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $warehouse = \App\Models\Warehouse::findOrFail(
                $validated['warehouse_id']
            );

            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'User is not assigned to a branch.',
                ], 422);
            }

            if ($warehouse->branch_id !== $user->branch_id) {
                return response()->json([
                    'message' => 'Warehouse does not belong to your branch.',
                ], 403);
            }

            $result = $this->saleService->createSale(
                $user,
                $warehouse,
                $validated['items'],
                $validated['payment_method'],
                (float) $validated['amount_paid'],
                $validated['payment_reference'] ?? null,
            );

            return response()->json([
                'message' => 'Sale completed successfully.',
                'data' => [
                    'sale' => $result['sale'],
                    'change_amount' => $result['change_amount'],
                ],
            ], 201);
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}