<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductQueryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $products,
        ]);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        if (!$product->is_active) {
            return response()->json([
                'message' => 'Product is inactive.',
            ], 404);
        }

        $product->load([
            'category',
            'recipes.inventoryItem.uom',
        ]);

        return response()->json([
            'data' => $product,
        ]);
    }
}