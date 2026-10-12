
import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Show({ productId }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await axios.get(
                    `/api/product-management/${productId}`
                );

                setProduct(response.data.data);
            } catch (err) {
                console.error('Failed to load product:', err);

                setError(
                    err.response?.data?.message ||
                        'Failed to load product details.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [productId]);

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
                        <Link
                            href="/products"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            &larr; Back to Products
                        </Link>

                        <h1 className="mt-3 text-2xl font-bold text-gray-900">
                            Product Details
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            View product information and recipe ingredients.
                        </p>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
                        Loading product details...
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Product Details */}
                {!loading && !error && product && (
                    <div className="space-y-6">
                        {/* Product Information */}
                        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Product Information
                                </h2>

                                <div className="flex flex-wrap items-center gap-3">
                                    {product.is_active ? (
                                        <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            Inactive
                                        </span>
                                    )}

                                    <Link
                                        href={`/products/${product.id}/edit`}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                    >
                                        Edit Product
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Product Name
                                    </p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {product.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        SKU
                                    </p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {product.sku}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Category
                                    </p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {product.category?.name ?? '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Selling Price
                                    </p>
                                    <p className="mt-1 font-semibold text-gray-900">
                                        {formatPrice(product.selling_price)}
                                    </p>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-sm text-gray-500">
                                        Description
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-gray-900">
                                        {product.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Recipe Ingredients */}
                        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Recipe / Ingredients
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Inventory quantities deducted when one product is sold.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Inventory Item
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                SKU
                                            </th>

                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Quantity Required
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                UOM
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {!product.recipes?.length ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-10 text-center text-sm text-gray-500"
                                                >
                                                    No recipe ingredients found.
                                                </td>
                                            </tr>
                                        ) : (
                                            product.recipes.map((recipe) => (
                                                <tr key={recipe.id}>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                        {recipe.inventory_item?.name ?? '-'}
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                        {recipe.inventory_item?.sku ?? '-'}
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                        {Number(recipe.quantity).toLocaleString(
                                                            undefined,
                                                            {
                                                                maximumFractionDigits: 3,
                                                            }
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                        {recipe.inventory_item?.uom?.abbreviation ?? '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                                <p className="text-xs text-gray-500">
                                    Recipe quantities represent the required inventory amount per product unit.
                                </p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="flex justify-end">
                            <Link
                                href="/products"
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Back to Products
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
