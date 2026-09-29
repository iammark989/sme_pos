<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access branches.',
            ], 403);
        }

        $branches = Branch::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
            ]);

        return response()->json([
            'data' => $branches,
        ]);
    }
}