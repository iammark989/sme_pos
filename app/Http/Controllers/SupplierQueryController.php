<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
         $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view suppliers.',
            ], 403);
        }

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
         $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view suppliers.',
            ], 403);
        }

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