<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sales = Sale::query()
            ->with([
                'items.product',
                'payments',
                'warehouse',
                'branch',
                'user',
            ])
            ->where('branch_id', $user->branch_id)
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $sales,
        ]);
    }

    public function show(Request $request, Sale $sale): JsonResponse
{
    $user = $request->user();

    if ($sale->branch_id !== $user->branch_id) {
        return response()->json([
            'message' => 'You are not allowed to view this sale.',
        ], 403);
    }

    $sale->load([
        'items.product',
        'payments',
        'warehouse',
        'branch',
        'user',
    ]);

    return response()->json([
        'data' => $sale,
    ]);
}
}