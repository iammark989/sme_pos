<?php

namespace App\Http\Controllers;

use App\Models\Uom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view units of measure.',
            ], 403);
        }

        $query = Uom::query();

        if ($request->query('status') !== 'all') {
            $query->where('is_active', true);
        }

        $uoms = $query
            ->orderBy('name')
            ->get(['id', 'name', 'abbreviation', 'type', 'is_active']);

        return response()->json([
            'data' => $uoms,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to create units of measure.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'abbreviation' => ['required', 'string', 'max:20'],
            'type' => ['required', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $duplicate = Uom::query()
            ->where('name', $validated['name'])
            ->where('abbreviation', $validated['abbreviation'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A unit of measure with this name and abbreviation already exists.',
                'errors' => [
                    'name' => [
                        'This name and abbreviation combination already exists.',
                    ],
                ],
            ], 422);
        }

        $uom = Uom::create($validated);

        return response()->json([
            'message' => 'Unit of measure created successfully.',
            'data' => $uom,
        ], 201);
    }

    public function update(Request $request, Uom $uom): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to update units of measure.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'abbreviation' => ['required', 'string', 'max:20'],
            'type' => ['required', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $duplicate = Uom::query()
            ->where('name', $validated['name'])
            ->where('abbreviation', $validated['abbreviation'])
            ->where('id', '!=', $uom->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A unit of measure with this name and abbreviation already exists.',
                'errors' => [
                    'name' => [
                        'This name and abbreviation combination already exists.',
                    ],
                ],
            ], 422);
        }

        $uom->update($validated);

        return response()->json([
            'message' => 'Unit of measure updated successfully.',
            'data' => $uom->fresh(),
        ]);
    }
}