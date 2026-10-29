<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BusinessDay;
use App\Models\ZReading;
use App\Services\BusinessDayService;
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

        $validated = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        if ($user->hasGlobalAccess()) {
            $branchId = isset($validated['branch_id'])
                ? (int) $validated['branch_id']
                : (int) Branch::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->orderBy('id')
                    ->value('id');

            if (! $branchId) {
                return response()->json([
                    'message' => 'No active branches are available.',
                ], 422);
            }

            $branch = Branch::query()
                ->where('id', $branchId)
                ->where('is_active', true)
                ->first();

            if (! $branch) {
                return response()->json([
                    'message' => 'The selected branch is unavailable or inactive.',
                ], 422);
            }
        } else {
            if (! $user->branch_id) {
                return response()->json([
                    'message' => 'Your account is not assigned to a branch.',
                ], 403);
            }

            $branchId = (int) $user->branch_id;
        }

        $businessDay = BusinessDay::query()
            ->with('zReading')
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->latest('business_date')
            ->first();

        $latestZReading = ZReading::query()
            ->with(['businessDay', 'branch', 'generatedBy'])
            ->where('branch_id', $branchId)
            ->latest('z_counter')
            ->first();

        return response()->json([
            'branch_id' => $branchId,
            'business_day' => $businessDay,
            'latest_z_reading' => $latestZReading,
        ]);
    }


    
    public function open(
        Request $request,
        BusinessDayService $businessDayService
    ): JsonResponse {
        $user = $request->user();

        if (!$user->branch_id) {
            return response()->json([
                'message' => 'Your account is not assigned to a branch.',
            ], 403);
        }

        try {
            $businessDay = $businessDayService->openForBranch(
                (int) $user->branch_id,
                $user
            );

            return response()->json([
                'message' => 'Business day opened successfully.',
                'business_day' => $businessDay,
            ], 201);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
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

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access Z-Reading reports.',
            ], 403);
        }

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        if ($user->hasGlobalAccess()) {
            $branchId = isset($validated['branch_id'])
                ? (int) $validated['branch_id']
                : null;

            if (!$branchId) {
                return response()->json([
                    'message' => 'Please select a branch.',
                ], 422);
            }

            $branchExists = Branch::query()
                ->whereKey($branchId)
                ->exists();

            if (!$branchExists) {
                return response()->json([
                    'message' => 'The selected branch does not exist.',
                ], 422);
            }
        } else {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Your account is not assigned to a branch.',
                ], 403);
            }

            $branchId = (int) $user->branch_id;
        }

        $businessDay = BusinessDay::query()
            ->where('branch_id', $branchId)
            ->whereDate('business_date', $validated['date'])
            ->first();

        if (!$businessDay) {
            return response()->json([
                'data' => [
                    'date' => $validated['date'],
                    'branch_id' => $branchId,
                    'business_day_exists' => false,
                    'message' => 'No business occure on selected date',
                    'z_reading' => null,
                ],
            ]);
        }

        $zReading = ZReading::query()
            ->with(['businessDay', 'branch', 'generatedBy'])
            ->where('business_day_id', $businessDay->id)
            ->first();

        return response()->json([
            'data' => [
                'date' => $validated['date'],
                'branch_id' => $branchId,
                'business_day_exists' => true,
                'business_day_status' => $businessDay->status,
                'z_reading' => $zReading,
                'message' => $zReading
                    ? null
                    : 'No Z-Reading has been generated for this business day.',
            ],
        ]);
    }

}