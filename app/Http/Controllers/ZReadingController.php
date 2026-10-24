<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BusinessDay;
use App\Models\ZReading;
use App\Services\ZReadingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ZReadingController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->branch_id) {
            return response()->json([
                'message' => 'Your account is not assigned to a branch.',
            ], 403);
        }

        $businessDay = BusinessDay::query()
            ->with('zReading')
            ->where('branch_id', $user->branch_id)
            ->where('status', 'open')
            ->latest('business_date')
            ->first();

        return response()->json([
            'business_day' => $businessDay,
        ]);
    }

    public function close(Request $request, ZReadingService $zReadingService): JsonResponse
    {
        $user = $request->user();

        if (! $user->branch_id) {
            return response()->json([
                'message' => 'Your account is not assigned to a branch.',
            ], 403);
        }

        $validated = $request->validate([
            'recovery_reason' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        try {
            $zReading = $zReadingService->closeBusinessDay(
                (int) $user->branch_id,
                $user,
                $validated['recovery_reason'] ?? null,
            );

            return response()->json([
                'message' => 'Z-Reading generated successfully.',
                'z_reading' => $zReading,
            ], 201);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function show(Request $request, ZReadingService $zReadingService, int $zReading): JsonResponse
    {
        $user = $request->user();

        if (! $user->branch_id) {
            return response()->json([
                'message' => 'Your account is not assigned to a branch.',
            ], 403);
        }

        $reading = $zReadingService->getSavedReading($zReading);

        if ((int) $reading->branch_id !== (int) $user->branch_id) {
            return response()->json([
                'message' => 'You are not authorized to view this Z-Reading.',
            ], 403);
        }

        return response()->json([
            'z_reading' => $reading,
        ]);
    }
}