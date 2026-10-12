import React, { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Index() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoryError, setCategoryError] = useState('');
    const [categorySuccess, setCategorySuccess] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });
    const [categorySaving, setCategorySaving] = useState(false);

    const loadCategories = async () => {
        setCategoriesLoading(true);
        setCategoryError('');

        try {
            const response = await axios.get('/api/product-categories', {
                params: { status: 'all' },
            });

            setCategories(response.data.data ?? []);
        } catch (err) {
            setCategoryError(
                err.response?.data?.message ||
                    'Failed to load categories.',
            );
        } finally {
            setCategoriesLoading(false);
        }
    };
    
    const resetCategoryForm = () => {
        setEditingCategory(null);
        setCategoryForm({
            name: '',
            slug: '',
            description: '',
            is_active: true,
        });
        setCategoryError('');
        setCategorySuccess('');
    };

    const openCategoryModal = async () => {
        setShowCategoryModal(true);
        resetCategoryForm();
        await loadCategories();
    };

    const handleCategoryEdit = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name ?? '',
            slug: category.slug ?? '',
            description: category.description ?? '',
            is_active: category.is_active ?? true,
        });
        setCategoryError('');
        setCategorySuccess('');
    };

    const handleCategorySubmit = async (event) => {
        event.preventDefault();

        setCategorySaving(true);
        setCategoryError('');
        setCategorySuccess('');

        try {
            const payload = {
                name: categoryForm.name.trim(),
                slug: categoryForm.slug.trim() || null,
                description: categoryForm.description.trim() || null,
                is_active: categoryForm.is_active,
            };

            if (editingCategory) {
                await axios.put(
                    `/api/product-categories/${editingCategory.id}`,
                    payload,
                );

                setCategorySuccess('Category updated successfully.');
            } else {
                await axios.post('/api/product-categories', payload);

                setCategorySuccess('Category created successfully.');
            }

            resetCategoryForm();
            await loadCategories();
        } catch (err) {
            const errors = err.response?.data?.errors;

            setCategoryError(
                errors
                    ? Object.values(errors).flat().join(' ')
                    : err.response?.data?.message ||
                        'Failed to save category.',
            );
        } finally {
            setCategorySaving(false);
        }
    };

    const handleCategoryStatusToggle = async (category) => {
        const nextStatus = !category.is_active;

        const confirmed = window.confirm(
            `${nextStatus ? 'Activate' : 'Deactivate'} category "${category.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        setCategoryError('');
        setCategorySuccess('');

        try {
            await axios.patch(
                `/api/product-categories/${category.id}/status`,
                { is_active: nextStatus },
            );

            setCategorySuccess(
                `Category "${category.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
            );

            await loadCategories();
        } catch (err) {
            setCategoryError(
                err.response?.data?.message ||
                    'Failed to update category status.',
            );
        }
    };


    const loadProducts = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('/api/product-management', {
                params: {
                    search: search.trim() || undefined,
                    status,
                    page,
                    per_page: 20,
                },
            });

            const result = response.data.data;

            setProducts(result?.data ?? []);
            setPagination(result ?? null);
        } catch (err) {
            console.error('Failed to load products:', err);

            setError(
                err.response?.data?.message ||
                    'Failed to load products. Please try again.'
            );

            setProducts([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => {
        loadProducts(1);
    }, [loadProducts]);

    const handleSearch = (event) => {
        event.preventDefault();
        loadProducts(1);
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
    };

    const handlePageChange = (page) => {
        if (
            !pagination ||
            page < 1 ||
            page > pagination.last_page
        ) {
            return;
        }

        loadProducts(page);
    };

    const formatPrice = (price) =>
        Number(price).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
        });

    return (
        <AuthenticatedLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Products
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage products, prices, recipes, and product status.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit('/products/create')}
                            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            + Create Product
                        </button>

                        <button
                            type="button"
                            onClick={openCategoryModal}
                            className="cursor-pointer rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                        >
                            Manage Categories
                        </button>
                    </div>

                </div>

                {/* Search and filters */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-4 md:grid-cols-4"
                    >
                        <div className="md:col-span-2">
                            <label
                                htmlFor="product-search"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Search Products
                            </label>

                            <input
                                id="product-search"
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by product name or SKU..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="product-status"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>

                            <select
                                id="product-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Products</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Product table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Product
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        SKU
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Category
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Selling Price
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr
                                            key={product.id}
                                            onClick={() =>
                                                router.visit(
                                                    `/products/${product.id}`
                                                )
                                            }
                                            className="cursor-pointer transition hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {product.sku}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {product.category?.name ?? '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                {formatPrice(product.selling_price)}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                {product.is_active ? (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            router.visit(`/products/${product.id}/edit`);
                                                        }}
                                                        className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            router.visit(`/products/${product.id}`);
                                                        }}
                                                        className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading &&
                        pagination &&
                        pagination.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing {pagination.from ?? 0} to{' '}
                                    {pagination.to ?? 0} of{' '}
                                    {pagination.total ?? 0} products
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.current_page - 1
                                            )
                                        }
                                        disabled={pagination.current_page === 1}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-600">
                                        Page {pagination.current_page} of{' '}
                                        {pagination.last_page}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.current_page + 1
                                            )
                                        }
                                        disabled={
                                            pagination.current_page ===
                                            pagination.last_page
                                        }
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            
            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Category Management
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Create, edit, activate, or deactivate product categories.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCategoryModal(false)}
                                className="cursor-pointer text-2xl leading-none text-gray-400 hover:text-gray-600"
                                aria-label="Close category management"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-2">
                            {/* Category Form */}
                            <div>
                                <h3 className="mb-4 text-base font-semibold text-gray-900">
                                    {editingCategory ? 'Edit Category' : 'Create Category'}
                                </h3>

                                {categoryError && (
                                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {categoryError}
                                    </div>
                                )}

                                {categorySuccess && (
                                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                        {categorySuccess}
                                    </div>
                                )}

                                <form onSubmit={handleCategorySubmit} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm.name}
                                            onChange={(event) =>
                                                setCategoryForm((current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                }))
                                            }
                                            required
                                            maxLength={255}
                                            placeholder="e.g. Beverages"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm.slug}
                                            onChange={(event) =>
                                                setCategoryForm((current) => ({
                                                    ...current,
                                                    slug: event.target.value,
                                                }))
                                            }
                                            maxLength={255}
                                            placeholder="Auto-generated if blank"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Leave blank to generate the slug from the category name.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={categoryForm.description}
                                            onChange={(event) =>
                                                setCategoryForm((current) => ({
                                                    ...current,
                                                    description: event.target.value,
                                                }))
                                            }
                                            rows={3}
                                            placeholder="Optional category description"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    {editingCategory && (
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={categoryForm.is_active}
                                                onChange={(event) =>
                                                    setCategoryForm((current) => ({
                                                        ...current,
                                                        is_active: event.target.checked,
                                                    }))
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            Active
                                        </label>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={categorySaving}
                                            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {categorySaving
                                                ? 'Saving...'
                                                : editingCategory
                                                ? 'Save Changes'
                                                : 'Create Category'}
                                        </button>

                                        {editingCategory && (
                                            <button
                                                type="button"
                                                onClick={resetCategoryForm}
                                                disabled={categorySaving}
                                                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Category List */}
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Categories
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={loadCategories}
                                        disabled={categoriesLoading}
                                        className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {categoriesLoading ? (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        Loading categories...
                                    </p>
                                ) : categories.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                                        No categories found.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="rounded-lg border border-gray-200 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900">
                                                            {category.name}
                                                        </p>
                                                        <p className="mt-1 break-all text-xs text-gray-500">
                                                            {category.slug}
                                                        </p>
                                                        {category.description && (
                                                            <p className="mt-2 text-sm text-gray-600">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                        <span
                                                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                category.is_active
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                        >
                                                            {category.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCategoryEdit(category)}
                                                            className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCategoryStatusToggle(category)
                                                            }
                                                            className={`text-sm font-medium ${
                                                                category.is_active
                                                                    ? 'text-red-600 hover:text-red-800 cursor-pointer'
                                                                    : 'text-green-600 hover:text-green-800 cursor-pointer'
                                                            }`}
                                                        >
                                                            {category.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
