<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Warehouse::query()
            ->with('branch')
            ->where('is_active', true);

        if ($user->role?->name !== 'Owner') {
            $query->where(function ($query) use ($user) {
                $query->whereNull('branch_id')
                    ->orWhere('branch_id', $user->branch_id);
            });
        }

        $warehouses = $query
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $warehouses,
        ]);
    }

    public function show(
        Request $request,
        Warehouse $warehouse
    ): JsonResponse {
        $user = $request->user();

        if (!$warehouse->is_active) {
            return response()->json([
                'message' => 'Warehouse is inactive.',
            ], 404);
        }

        if (
            $warehouse->branch_id !== null &&
            $warehouse->branch_id !== $user->branch_id
        ) {
            return response()->json([
                'message' => 'You are not allowed to view this warehouse.',
            ], 403);
        }

        $warehouse->load('branch');

        return response()->json([
            'data' => [
                'warehouse' => $warehouse,
            ],
        ]);
    }
}