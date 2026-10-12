import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Edit({ inventoryItemId }) {
    const { auth } = usePage().props;
    const canManage = ['Owner', 'Admin'].includes(auth.user.role?.name);

    const [form, setForm] = useState({
        name: '',
        sku: '',
        uom_id: '',
        description: '',
        reorder_level: '0.000',
        is_active: true,
    });

    const [uoms, setUoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setErrorMessage('');

            try {
                const [itemResponse, uomResponse] = await Promise.all([
                    axios.get(`/api/inventory-items/${inventoryItemId}`),
                    axios.get('/api/uoms?status=all'),
                ]);

                const item =
                    itemResponse.data.data?.inventory_item ??
                    itemResponse.data.data;

                const allUoms = uomResponse.data.data ?? [];
                const itemUomId = Number(item.uom_id);

                // Include the item's current UOM even if it has since
                // become inactive. Do not offer other inactive UOMs.
                const availableUoms = allUoms.filter(
                    (uom) => uom.is_active || Number(uom.id) === itemUomId
                );

                setUoms(availableUoms);

                setForm({
                    name: item.name ?? '',
                    sku: item.sku ?? '',
                    uom_id: String(item.uom_id ?? ''),
                    description: item.description ?? '',
                    reorder_level: String(item.reorder_level ?? '0.000'),
                    is_active: Boolean(item.is_active),
                });
            } catch (error) {
                console.error('Failed to load inventory item:', error);
                setErrorMessage(
                    error.response?.data?.message ||
                        'Failed to load inventory item details.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [inventoryItemId]);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: undefined,
        }));

        setErrorMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canManage || saving) return;

        setSaving(true);
        setErrors({});
        setErrorMessage('');

        try {
            await axios.put(`/api/inventory-items/${inventoryItemId}`, {
                ...form,
                uom_id: Number(form.uom_id),
                reorder_level: Number(form.reorder_level),
            });

            router.visit('/inventory-items');
        } catch (error) {
            console.error('Failed to update inventory item:', error);

            if (error.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
                setErrorMessage(
                    error.response.data.message ||
                        'Please correct the validation errors.'
                );
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                        'Failed to update inventory item.'
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (!canManage) {
        return (
            <AuthenticatedLayout>
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    You are not authorized to edit inventory items.
                    <div className="mt-3">
                        <Link
                            href="/inventory-items"
                            className="font-medium underline"
                        >
                            Back to Inventory Items
                        </Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <Link
                        href="/inventory-items"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        &larr; Back to Inventory Items
                    </Link>

                    <h1 className="mt-3 text-2xl font-bold text-gray-900">
                        Edit Inventory Item
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Update inventory item details without changing its stock balance.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
                        Loading inventory item...
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                        <div className="space-y-6 p-6">
                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {errorMessage}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Item Name <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="name"
                                        required
                                        maxLength={255}
                                        value={form.name}
                                        onChange={(event) =>
                                            updateField('name', event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.name?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="sku"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        SKU <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="sku"
                                        required
                                        maxLength={255}
                                        value={form.sku}
                                        onChange={(event) =>
                                            updateField('sku', event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.sku?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="uom_id"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Unit of Measure <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        id="uom_id"
                                        required
                                        value={form.uom_id}
                                        onChange={(event) =>
                                            updateField('uom_id', event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select a unit</option>

                                        {uoms.map((uom) => (
                                            <option key={uom.id} value={uom.id}>
                                                {uom.name} ({uom.abbreviation})
                                                {!uom.is_active ? ' — Inactive (current)' : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.uom_id?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="reorder_level"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Reorder Level <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="reorder_level"
                                        type="number"
                                        required
                                        min="0"
                                        step="0.001"
                                        value={form.reorder_level}
                                        onChange={(event) =>
                                            updateField(
                                                'reorder_level',
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.reorder_level?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="description"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        id="description"
                                        rows={3}
                                        value={form.description}
                                        onChange={(event) =>
                                            updateField(
                                                'description',
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.description?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(event) =>
                                                updateField(
                                                    'is_active',
                                                    event.target.checked
                                                )
                                            }
                                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />

                                        <span>
                                            <span className="block text-sm font-medium text-gray-800">
                                                Active inventory item
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500">
                                                Deactivating an item does not delete it or its historical inventory records.
                                            </span>
                                        </span>
                                    </label>

                                    {errors.is_active?.map((message, index) => (
                                        <p key={index} className="mt-1 text-xs text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <Link
                                href="/inventory-items"
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}