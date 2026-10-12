
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
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Products
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage products, prices, recipes, and product status.
                    </p>
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
                                                    `/admin/products/${product.id}`
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
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();

                                                        router.visit(
                                                            `/admin/products/${product.id}`
                                                        );
                                                    }}
                                                    className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    View Details
                                                </button>
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
        </AuthenticatedLayout>
    );
}
