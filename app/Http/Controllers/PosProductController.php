<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $shift = Shift::query()
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'You must have an open shift before accessing POS products.',
            ], 422);
        }

        $products = Product::query()
            ->with([
                'category',
                'recipes.inventoryItem.uom',
                'recipes.inventoryItem.stocks' => function ($query) use ($shift) {
                    $query->where('warehouse_id', $shift->warehouse_id);
                },
            ])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $products->transform(function ($product) {
                $maxQuantity = null;

                foreach ($product->recipes as $recipe) {
                    $stock = $recipe->inventoryItem->stocks->first();

                    if (!$stock || (float) $recipe->quantity <= 0) {
                        $maxQuantity = 0;
                        break;
                    }

                    $availableQuantity = floor(
                        (float) $stock->quantity / (float) $recipe->quantity
                    );

                    if ($maxQuantity === null || $availableQuantity < $maxQuantity) {
                        $maxQuantity = $availableQuantity;
                    }
                }

                $product->max_quantity = $maxQuantity ?? 0;
                $product->can_sell = $product->max_quantity > 0;

                return $product;
            });

        return response()->json([
            'data' => [
                'shift' => $shift->load(['branch', 'warehouse']),
                'products' => $products,
            ],
        ]);
    }
}