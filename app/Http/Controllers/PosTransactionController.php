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

        if (!$user->branch_id) {
            return response()->json([
                'message' => 'You are not assigned to a branch.',
            ], 403);
        }

        $sales = Sale::query()
            ->with([
                'payments',
            ])
            ->where('branch_id', $user->branch_id)
            ->where('status', 'completed')
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
}