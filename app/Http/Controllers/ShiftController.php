<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Warehouse;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class ShiftController extends Controller
{
    public function __construct(
        protected ShiftService $shiftService
    ) {
    }

    public function open(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => [
                'required',
                'integer',
                'exists:branches,id',
            ],
            'warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],
            'opening_cash' => [
                'required',
                'numeric',
                'gte:0',
            ],
            'opening_notes' => [
                'nullable',
                'string',
            ],
        ]);

        $user = $request->user();

        $branch = Branch::findOrFail(
            $validated['branch_id']
        );

        $warehouse = Warehouse::findOrFail(
            $validated['warehouse_id']
        );

        try {
            $shift = $this->shiftService->openShift(
                user: $user,
                branch: $branch,
                warehouse: $warehouse,
                openingCash: (float) $validated['opening_cash'],
                openingNotes: $validated['opening_notes'] ?? null,
            );

            $shift->load([
                'user',
                'branch',
                'warehouse',
            ]);

            return response()->json([
                'message' => 'Shift opened successfully.',
                'data' => [
                    'shift' => $shift,
                ],
            ], 201);

        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function current(Request $request): JsonResponse
    {
        $shift = $request->user()
            ->shifts()
            ->where('status', 'open')
            ->with([
                'user',
                'branch',
                'warehouse',
            ])
            ->latest('opened_at')
            ->first();

        return response()->json([
            'data' => [
                'shift' => $shift,
            ],
        ]);
    }

    public function close(Request $request): JsonResponse
{
    $validated = $request->validate([
        'actual_cash' => [
            'required',
            'numeric',
            'gte:0',
        ],
        'closing_notes' => [
            'nullable',
            'string',
        ],
    ]);

    $user = $request->user();

    $shift = $user->shifts()
        ->where('status', 'open')
        ->latest('opened_at')
        ->first();

    if (!$shift) {
        return response()->json([
            'message' => 'You do not have an open shift.',
        ], 422);
    }

    try {
        $shift = $this->shiftService->closeShift(
            shift: $shift,
            actualCash: (float) $validated['actual_cash'],
            closingNotes: $validated['closing_notes'] ?? null,
        );

        $shift->load([
            'user',
            'branch',
            'warehouse',
        ]);

        return response()->json([
            'message' => 'Shift closed successfully.',
            'data' => [
                'shift' => $shift,
            ],
        ]);

    } catch (RuntimeException $e) {
        return response()->json([
            'message' => $e->getMessage(),
        ], 422);
    }
}
}