<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\VoidSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class VoidTransactionController extends Controller
{
    public function store(
        Request $request,
        Sale $sale,
        VoidSaleService $voidSaleService
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        try {
            $sale = $voidSaleService->voidSale(
                $sale,
                $request->user(),
                $validated['reason']
            );

            return response()->json([
                'message' => 'Transaction voided successfully.',
                'data' => $sale,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 403);
        }
    }
}