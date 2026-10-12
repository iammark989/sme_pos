<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductManagementController extends Controller
{
    private function authorizeManagement(Request $request): ?JsonResponse
    {
        if (!in_array(
            $request->user()->role?->name,
            ['Owner', 'Admin'],
            true
        )) {
            return response()->json([
                'message' => 'You are not authorized to manage products.',
            ], 403);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $products = Product::query()
            ->with(['category', 'recipes.inventoryItem.uom'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim($request->string('search')->toString());

                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json([
            'data' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('is_active', true),
            ],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:255', 'unique:products,sku'],
            'description' => ['nullable', 'string'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'recipes' => ['required', 'array', 'min:1'],
            'recipes.*.inventory_item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('inventory_items', 'id')->where('is_active', true),
            ],
            'recipes.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $product = DB::transaction(function () use ($validated) {
            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'] ?? null,
                'selling_price' => $validated['selling_price'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $product->recipes()->createMany($validated['recipes']);

            return $product;
        });

        return response()->json([
            'message' => 'Product created successfully.',
            'data' => $product->load([
                'category',
                'recipes.inventoryItem.uom',
            ]),
        ], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        return response()->json([
            'data' => $product->load([
                'category',
                'recipes.inventoryItem.uom',
            ]),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $validated = $request->validate([
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('categories', 'id')
                    ->where(function ($query) use ($product) {
                        $query->where('is_active', true)
                            ->orWhere('id', $product->category_id);
                    }),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'description' => ['nullable', 'string'],
            'selling_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'recipes' => ['sometimes', 'required', 'array', 'min:1'],
            'recipes.*.inventory_item_id' => [
                'required_with:recipes',
                'integer',
                'distinct',
                Rule::exists('inventory_items', 'id')
                    ->where(function ($query) use ($product) {
                        $query->where('is_active', true)
                            ->orWhereIn(
                                'id',
                                $product->recipes()->pluck('inventory_item_id')
                            );
                    }),
            ],
            'recipes.*.quantity' => [
                'required_with:recipes',
                'numeric',
                'gt:0',
            ],
        ]);

        $product = DB::transaction(function () use ($validated, $product) {
            $product->fill(collect($validated)->except('recipes')->all());
            $product->save();

            if (array_key_exists('recipes', $validated)) {
                $product->recipes()->delete();
                $product->recipes()->createMany($validated['recipes']);
            }

            return $product;
        });

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->load([
                'category',
                'recipes.inventoryItem.uom',
            ]),
        ]);
    }
}