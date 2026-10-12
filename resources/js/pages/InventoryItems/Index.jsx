import React, { useCallback, useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

const emptyUomForm = {
    name: '',
    abbreviation: '',
    type: 'count',
    is_active: true,
};

export default function Index() {
    const { auth } = usePage().props;
    const user = auth.user;
    const canManage = ['Owner', 'Admin'].includes(user.role?.name);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const [uoms, setUoms] = useState([]);
    const [uomModalOpen, setUomModalOpen] = useState(false);
    const [editingUomId, setEditingUomId] = useState(null);
    const [uomForm, setUomForm] = useState(emptyUomForm);
    const [uomErrors, setUomErrors] = useState({});
    const [uomError, setUomError] = useState('');
    const [uomLoading, setUomLoading] = useState(false);
    const [uomSaving, setUomSaving] = useState(false);

    const loadItems = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('/api/inventory-items', {
                params: {
                    search: search.trim() || undefined,
                    status,
                    page,
                },
            });

            // The API wraps Laravel's paginator in the "data" property.
            const paginator = response.data.data;

            setItems(paginator?.data ?? []);
            setPagination(paginator ?? null);
        } catch (err) {
            console.error('Failed to load inventory items:', err);
            setError(
                err.response?.data?.message ||
                    'Failed to load inventory items.'
            );
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    const loadUoms = useCallback(async () => {
        setUomLoading(true);
        setUomError('');

        try {
            const response = await axios.get('/api/uoms', {
                params: { status: 'all' },
            });

            setUoms(response.data.data ?? []);
        } catch (err) {
            console.error('Failed to load UOMs:', err);
            setUomError(
                err.response?.data?.message ||
                    'Failed to load units of measure.'
            );
        } finally {
            setUomLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems(1);
    }, [loadItems]);

    const openCreateUom = () => {
        setEditingUomId(null);
        setUomForm({ ...emptyUomForm });
        setUomErrors({});
        setUomError('');
        setUomModalOpen(true);
        loadUoms();
    };

    const openEditUom = (uom) => {
        setEditingUomId(uom.id);
        setUomForm({
            name: uom.name ?? '',
            abbreviation: uom.abbreviation ?? '',
            type: uom.type ?? 'count',
            is_active: Boolean(uom.is_active),
        });
        setUomErrors({});
        setUomError('');
        setUomModalOpen(true);
    };

    const closeUomModal = () => {
        if (uomSaving) return;

        setUomModalOpen(false);
        setEditingUomId(null);
        setUomForm({ ...emptyUomForm });
        setUomErrors({});
        setUomError('');
    };

    const handleUomSubmit = async (event) => {
        event.preventDefault();

        if (!canManage || uomSaving) return;

        setUomSaving(true);
        setUomErrors({});
        setUomError('');
        setActionMessage('');

        try {
            if (editingUomId) {
                await axios.put(`/api/uoms/${editingUomId}`, uomForm);
                setActionMessage('Unit of measure updated successfully.');
            } else {
                await axios.post('/api/uoms', uomForm);
                setActionMessage('Unit of measure created successfully.');
            }

            await loadUoms();
            setUomModalOpen(false);
            setEditingUomId(null);
            setUomForm({ ...emptyUomForm });
        } catch (err) {
            console.error('Failed to save UOM:', err);

            if (err.response?.status === 422) {
                setUomErrors(err.response.data.errors ?? {});
                setUomError(
                    err.response.data.message ||
                        'Please check the form fields.'
                );
            } else {
                setUomError(
                    err.response?.data?.message ||
                        'Failed to save unit of measure.'
                );
            }
        } finally {
            setUomSaving(false);
        }
    };

    const handleUomStatus = async (uom) => {
        if (!canManage) return;

        const action = uom.is_active ? 'deactivate' : 'activate';

        if (
            !window.confirm(
                `Are you sure you want to ${action} "${uom.name}" (${uom.abbreviation})?`
            )
        ) {
            return;
        }

        setUomError('');
        setActionMessage('');

        try {
            await axios.put(`/api/uoms/${uom.id}`, {
                name: uom.name,
                abbreviation: uom.abbreviation,
                type: uom.type,
                is_active: !uom.is_active,
            });

            await loadUoms();
            setActionMessage(
                `Unit of measure ${action}d successfully.`
            );
        } catch (err) {
            console.error('Failed to change UOM status:', err);
            setUomError(
                err.response?.data?.message ||
                    'Failed to change unit of measure status.'
            );
        }
    };

    const handleItemStatus = async (item) => {
        if (!canManage) return;

        const action = item.is_active ? 'deactivate' : 'activate';

        if (
            !window.confirm(
                `Are you sure you want to ${action} "${item.name}"?`
            )
        ) {
            return;
        }

        setError('');
        setActionMessage('');

        try {
            const response = await axios.patch(
                `/api/inventory-items/${item.id}/status`,
                { is_active: !item.is_active }
            );

            setActionMessage(
                response.data.message ||
                    `Inventory item ${action}d successfully.`
            );

            await loadItems(pagination?.current_page ?? 1);
        } catch (err) {
            console.error('Failed to change inventory item status:', err);
            setError(
                err.response?.data?.message ||
                    'Failed to change inventory item status.'
            );
        }
    };

    const formatNumber = (value) =>
        Number(value ?? 0).toLocaleString(undefined, {
            maximumFractionDigits: 3,
        });

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* Page header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Inventory Items
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage inventory item details, units of measure,
                            and reorder levels.
                        </p>
                    </div>

                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={openCreateUom}
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Manage UOMs
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    router.visit('/inventory-items/create')
                                }
                                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                + Add Inventory Item
                            </button>
                        </div>
                    )}
                </div>

                {/* Feedback */}
                {actionMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {actionMessage}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto_auto] md:items-end">
                        <div>
                            <label
                                htmlFor="inventory-search"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Search inventory items
                            </label>
                            <input
                                id="inventory-search"
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        loadItems(1);
                                    }
                                }}
                                placeholder="Search by item name or SKU..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="inventory-status"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>
                            <select
                                id="inventory-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="all">All Items</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadItems(1)}
                            className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setStatus('active');
                            }}
                            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </section>

                {/* Items table */}
                <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Inventory Item List
                        </h2>

                        {pagination && (
                            <span className="text-sm text-gray-500">
                                {pagination.total} item
                                {pagination.total === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-sm text-gray-500">
                            Loading inventory items...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Item
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            SKU
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            UOM
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Reorder Level
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-12 text-center text-sm text-gray-500"
                                            >
                                                No inventory items found.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        {item.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {item.sku}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {item.uom?.name ?? '-'}
                                                    {item.uom?.abbreviation && (
                                                        <span className="ml-1 text-xs text-gray-400">
                                                            ({item.uom.abbreviation})
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700">
                                                    {formatNumber(item.reorder_level)}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-center">
                                                    {item.is_active ? (
                                                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                                                    {canManage ? (
                                                        <div className="flex justify-end gap-3">
                                                            <Link
                                                                href={`/inventory-items/${item.id}/edit`}
                                                                className="font-medium text-blue-600 hover:text-blue-800"
                                                            >
                                                                Edit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleItemStatus(item)
                                                                }
                                                                className={
                                                                    item.is_active
                                                                        ? 'font-medium text-red-600 hover:text-red-800 cursor-pointer'
                                                                        : 'font-medium text-green-600 hover:text-green-800 cursor-pointer'
                                                                }
                                                            >
                                                                {item.is_active
                                                                    ? 'Deactivate'
                                                                    : 'Activate'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pagination && pagination.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.current_page} of{' '}
                                {pagination.last_page}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={!pagination.prev_page_url}
                                    onClick={() =>
                                        loadItems(pagination.current_page - 1)
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={!pagination.next_page_url}
                                    onClick={() =>
                                        loadItems(pagination.current_page + 1)
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* UOM management modal */}
                {uomModalOpen && canManage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeUomModal();
                            }
                        }}
                    >
                        <div className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Manage Units of Measure
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Create, edit, or deactivate UOM records.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeUomModal}
                                    disabled={uomSaving}
                                    className="cursor-pointer rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
                                    aria-label="Close modal"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
                                {/* UOM form */}
                                <form
                                    onSubmit={handleUomSubmit}
                                    className="space-y-4"
                                >
                                    <h3 className="font-semibold text-gray-900">
                                        {editingUomId
                                            ? 'Edit Unit of Measure'
                                            : 'Add Unit of Measure'}
                                    </h3>

                                    {uomError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {uomError}
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            required
                                            maxLength={255}
                                            value={uomForm.name}
                                            onChange={(event) =>
                                                setUomForm((current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            placeholder="e.g. Kilogram"
                                        />
                                        {uomErrors.name?.map((message, index) => (
                                            <p
                                                key={index}
                                                className="mt-1 text-xs text-red-600"
                                            >
                                                {message}
                                            </p>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Abbreviation
                                        </label>
                                        <input
                                            required
                                            maxLength={20}
                                            value={uomForm.abbreviation}
                                            onChange={(event) =>
                                                setUomForm((current) => ({
                                                    ...current,
                                                    abbreviation: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            placeholder="e.g. kg"
                                        />
                                        {uomErrors.abbreviation?.map(
                                            (message, index) => (
                                                <p
                                                    key={index}
                                                    className="mt-1 text-xs text-red-600"
                                                >
                                                    {message}
                                                </p>
                                            )
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Type
                                        </label>
                                        <select
                                            required
                                            value={uomForm.type}
                                            onChange={(event) =>
                                                setUomForm((current) => ({
                                                    ...current,
                                                    type: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="count">Count</option>
                                            <option value="weight">Weight</option>
                                            <option value="volume">Volume</option>
                                        </select>
                                        {uomErrors.type?.map((message, index) => (
                                            <p
                                                key={index}
                                                className="mt-1 text-xs text-red-600"
                                            >
                                                {message}
                                            </p>
                                        ))}
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={uomForm.is_active}
                                            onChange={(event) =>
                                                setUomForm((current) => ({
                                                    ...current,
                                                    is_active: event.target.checked,
                                                }))
                                            }
                                            className="rounded border-gray-300"
                                        />
                                        Active
                                    </label>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={uomSaving}
                                            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {uomSaving
                                                ? 'Saving...'
                                                : editingUomId
                                                  ? 'Save Changes'
                                                  : 'Create UOM'}
                                        </button>

                                        {editingUomId && (
                                            <button
                                                type="button"
                                                disabled={uomSaving}
                                                onClick={() => {
                                                    setEditingUomId(null);
                                                    setUomForm({
                                                        ...emptyUomForm,
                                                    });
                                                    setUomErrors({});
                                                    setUomError('');
                                                }}
                                                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>

                                {/* UOM list */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900">
                                        Existing Units
                                    </h3>

                                    {uomLoading ? (
                                        <p className="text-sm text-gray-500">
                                            Loading units...
                                        </p>
                                    ) : uoms.length === 0 ? (
                                        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                                            No units of measure found.
                                        </p>
                                    ) : (
                                        <div className="max-h-96 space-y-2 overflow-y-auto">
                                            {uoms.map((uom) => (
                                                <div
                                                    key={uom.id}
                                                    className="rounded-lg border border-gray-200 p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900">
                                                                {uom.name}{' '}
                                                                <span className="text-gray-500">
                                                                    ({uom.abbreviation})
                                                                </span>
                                                            </p>
                                                            <p className="mt-1 text-xs capitalize text-gray-500">
                                                                {uom.type}
                                                            </p>
                                                            <span
                                                                className={
                                                                    uom.is_active
                                                                        ? 'mt-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                                                                        : 'mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                                                                }
                                                            >
                                                                {uom.is_active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditUom(uom)
                                                                }
                                                                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleUomStatus(uom)
                                                                }
                                                                className={
                                                                    uom.is_active
                                                                        ? 'text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer'
                                                                        : 'text-xs font-medium text-green-600 hover:text-green-800 cursor-pointer'
                                                                }
                                                            >
                                                                {uom.is_active
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

                            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeUomModal}
                                    disabled={uomSaving}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}