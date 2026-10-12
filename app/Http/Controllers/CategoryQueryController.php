<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CategoryQueryController extends Controller
{
    private function authorizeManagement(Request $request): ?JsonResponse
    {
        if (!in_array($request->user()->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to manage product categories.',
            ], 403);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view product categories.',
            ], 403);
        }

        $query = Category::query()->orderBy('name');

        if ($request->query('status') !== 'all') {
            $query->where('is_active', true);
        }

        return response()->json([
            'data' => $query->get([
                'id',
                'name',
                'slug',
                'description',
                'is_active',
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name'),
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug'),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['slug'] = Str::slug(
            $validated['slug'] ?? $validated['name']
        );

        // Check the generated slug too, in case the client omitted it.
        $slugExists = Category::where('slug', $validated['slug'])->exists();

        if ($slugExists) {
            return response()->json([
                'message' => 'The generated slug is already in use. Please provide a unique slug.',
                'errors' => [
                    'slug' => ['The generated slug is already in use.'],
                ],
            ], 422);
        }

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('slug', $validated) && $validated['slug'] !== null) {
            $validated['slug'] = Str::slug($validated['slug']);
        } elseif (array_key_exists('name', $validated) && !array_key_exists('slug', $validated)) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (isset($validated['slug'])) {
            $slugExists = Category::where('slug', $validated['slug'])
                ->where('id', '!=', $category->id)
                ->exists();

            if ($slugExists) {
                return response()->json([
                    'message' => 'The slug is already in use. Please provide a unique slug.',
                    'errors' => [
                        'slug' => ['The slug is already in use.'],
                    ],
                ], 422);
            }
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => $category->fresh(),
        ]);
    }

    public function updateStatus(Request $request, Category $category): JsonResponse
    {
        if ($response = $this->authorizeManagement($request)) {
            return $response;
        }

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $category->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => 'Category status updated successfully.',
            'data' => $category->fresh(),
        ]);
    }
}