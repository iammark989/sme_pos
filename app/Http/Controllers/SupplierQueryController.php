<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $suppliers,
        ]);
    }

    public function show(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        if (!$supplier->is_active) {
            return response()->json([
                'message' => 'Supplier is inactive.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'supplier' => $supplier,
            ],
        ]);
    }
}