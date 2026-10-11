<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view product categories.',
            ], 403);
        }

        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        return response()->json([
            'data' => $categories,
        ]);
    }
}