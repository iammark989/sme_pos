<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosTransactionController extends Controller
{
   public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Sale::query()
            ->with([
                'payments',
            ])
            ->where('status', 'completed');

        if ($user->role?->name === 'Owner') {
            // Owner can view transactions across all branches.
        } elseif ($user->role?->name === 'Staff') {
            $query->where('user_id', $user->id);
        } else {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'You are not assigned to a branch.',
                ], 403);
            }

            $query->where('branch_id', $user->branch_id);
        }

        $sales = $query
            ->latest()
            ->limit(10)
            ->get([
                'id',
                'branch_id',
                'warehouse_id',
                'user_id',
                'shift_id',
                'sale_number',
                'status',
                'subtotal',
                'discount_amount',
                'total_amount',
                'created_at',
            ]);

        return response()->json([
            'data' => $sales,
        ]);
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        $user = $request->user();

        if ($user->role?->name === 'Owner') {
            // Owner can view any transaction.
        } elseif ($user->role?->name === 'Staff') {
            if ($sale->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not allowed to view this transaction.',
                ], 403);
            }
        } else {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'You are not assigned to a branch.',
                ], 403);
            }

            if ($sale->branch_id !== $user->branch_id) {
                return response()->json([
                    'message' => 'You are not allowed to view this transaction.',
                ], 403);
            }
        }

        if ($sale->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed transactions can be viewed.',
            ], 422);
        }

        $sale->load([
            'items.product',
            'payments',
            'warehouse',
            'branch',
            'user',
            'shift',
        ]);

        return response()->json([
            'data' => $sale,
        ]);
    }
}