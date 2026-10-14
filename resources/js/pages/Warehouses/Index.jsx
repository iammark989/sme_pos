
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [warehouses, setWarehouses] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [branches, setBranches] = useState([]);

    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const [editingWarehouseId, setEditingWarehouseId] = useState(null);

    const isEditMode = editingWarehouseId !== null;

    const [form, setForm] = useState({
        name: '',
        code: '',
        type: 'branch',
        branch_id: '',
        is_active: true,
    });

    
    const handleToggleWarehouseStatus = async (warehouse) => {
        const nextIsActive = !warehouse.is_active;
        const action = nextIsActive ? 'activate' : 'deactivate';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} warehouse "${warehouse.name}"?`
        );

        if (!confirmed) return;

        setUpdatingStatusId(warehouse.id);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.patch(
                `/api/warehouse-management/${warehouse.id}/status`,
                {
                    is_active: nextIsActive,
                }
            );

            await loadWarehouses(pagination.current_page);

            setSuccessMessage(
                response.data.message ||
                    `Warehouse ${nextIsActive ? 'activated' : 'deactivated'} successfully.`
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    `Unable to ${action} warehouse. Please try again.`
            );
        } finally {
            setUpdatingStatusId(null);
        }
    };
    
    const loadBranches = async () => {
        try {
            const response = await axios.get('/api/branches');

            setBranches(response.data.data ?? []);
        } catch (err) {
            setFormErrors({
                general:
                    err.response?.data?.message ||
                    'Unable to load branches. Please try again.',
            });
        }
    };

    const openCreateModal = async () => {
        setForm({
            name: '',
            code: '',
            type: 'branch',
            branch_id: '',
            is_active: true,
        });

        setEditingWarehouseId(null);
        setFormErrors({});
        setSuccessMessage('');
        setShowCreateModal(true);

        await loadBranches();
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));

        setFormErrors((previous) => ({
            ...previous,
            [name]: undefined,
            general: undefined,
        }));
    };

    const handleCreateWarehouse = async (event) => {
        event.preventDefault();

        setSaving(true);
        setFormErrors({});
        setSuccessMessage('');

        try {
            await axios.post('/api/warehouse-management', {
                ...form,
                branch_id: form.branch_id === ''
                    ? null
                    : Number(form.branch_id),
            });

            setShowCreateModal(false);
            setSuccessMessage('Warehouse created successfully.');

            await loadWarehouses(1);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(
                    err.response.data.errors ?? {
                        general:
                            err.response.data.message ||
                            'Please check the submitted information.',
                    }
                );
            } else {
                setFormErrors({
                    general:
                        err.response?.data?.message ||
                        'Unable to create warehouse. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    
    const openEditModal = async (warehouseId) => {
        setEditingWarehouseId(warehouseId);
        setFormErrors({});
        setSuccessMessage('');
        setError('');
        setShowCreateModal(true);

        try {
            const response = await axios.get(
                `/api/warehouse-management/${warehouseId}`
            );

            const warehouse = response.data.data;

            setForm({
                name: warehouse.name ?? '',
                code: warehouse.code ?? '',
                type: warehouse.type ?? 'branch',
                branch_id: warehouse.branch_id
                    ? String(warehouse.branch_id)
                    : '',
                is_active: Boolean(warehouse.is_active),
            });
        } catch (err) {
            setShowCreateModal(false);
            setEditingWarehouseId(null);

            setError(
                err.response?.data?.message ||
                    'Unable to load warehouse details. Please try again.'
            );
        }
    };

    const handleUpdateWarehouse = async (event) => {
        event.preventDefault();

        if (editingWarehouseId === null) return;

        setSaving(true);
        setFormErrors({});
        setSuccessMessage('');

        try {
            await axios.put(
                `/api/warehouse-management/${editingWarehouseId}`,
                {
                    ...form,
                    branch_id: form.branch_id === ''
                        ? null
                        : Number(form.branch_id),
                }
            );

            setShowCreateModal(false);
            setEditingWarehouseId(null);
            setSuccessMessage('Warehouse updated successfully.');

            await loadWarehouses(pagination.current_page);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(
                    err.response.data.errors ?? {
                        general:
                            err.response.data.message ||
                            'Please check the submitted information.',
                    }
                );
            } else {
                setFormErrors({
                    general:
                        err.response?.data?.message ||
                        'Unable to update warehouse. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };



    const loadWarehouses = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get(
                '/api/warehouse-management',
                {
                    params: { page },
                }
            );

            const paginator = response.data.data;

            setWarehouses(paginator.data ?? []);
            setPagination({
                current_page: paginator.current_page,
                last_page: paginator.last_page,
                total: paginator.total,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Unable to load warehouses. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWarehouses();
    }, [loadWarehouses]);

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Warehouse Management
                        </h1>

                        <p className="mt-1 text-sm text-gray-600">
                            Manage warehouse locations, branch assignments,
                            and warehouse status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Create Warehouse
                    </button>
                </div>


                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {successMessage}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Warehouses
                        </h2>

                        <span className="text-sm text-gray-500">
                            {pagination.total} total
                        </span>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            Loading warehouses...
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            No warehouses found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            'Warehouse Name',
                                            'Code',
                                            'Type',
                                            'Branch',
                                            'Status',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {warehouses.map((warehouse) => (
                                        <tr
                                            key={warehouse.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {warehouse.name}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {warehouse.code}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {warehouse.type === 'main'
                                                    ? 'Main'
                                                    : 'Branch'}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {warehouse.branch?.name ||
                                                    'Unassigned'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {warehouse.is_active ? (
                                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(warehouse.id)}
                                                    disabled={updatingStatusId !== null}
                                                    className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleWarehouseStatus(warehouse)}
                                                    disabled={updatingStatusId !== null}
                                                    className={`cursor-pointer rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        warehouse.is_active
                                                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                                                            : 'border-green-200 text-green-700 hover:bg-green-50'
                                                    }`}
                                                >
                                                    {updatingStatusId === warehouse.id
                                                        ? 'Updating...'
                                                        : warehouse.is_active
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                            <span className="text-sm text-gray-600">
                                Page {pagination.current_page} of{' '}
                                {pagination.last_page}
                            </span>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        loadWarehouses(
                                            pagination.current_page - 1
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        loadWarehouses(
                                            pagination.current_page + 1
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {isEditMode ? 'Edit Warehouse' : 'Create Warehouse'}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {isEditMode
                                        ? 'Update the warehouse details.'
                                        : 'Enter the new warehouse details.'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingWarehouseId(null);
                                    }}
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    &times;
                                </button>
                            </div>

                            <form
                                onSubmit={isEditMode ? handleUpdateWarehouse : handleCreateWarehouse}
                                className="space-y-5 p-6"
                            >
                                {formErrors.general && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {formErrors.general}
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="warehouse-name"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Warehouse Name
                                    </label>
                                    <input
                                        id="warehouse-name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleFormChange}
                                        required
                                        maxLength={255}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    {formErrors.name?.map((message, index) => (
                                        <p key={index} className="mt-1 text-sm text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="warehouse-code"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Warehouse Code
                                    </label>
                                    <input
                                        id="warehouse-code"
                                        name="code"
                                        value={form.code}
                                        onChange={handleFormChange}
                                        required
                                        maxLength={255}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    {formErrors.code?.map((message, index) => (
                                        <p key={index} className="mt-1 text-sm text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="warehouse-type"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Warehouse Type
                                    </label>
                                    <select
                                        id="warehouse-type"
                                        name="type"
                                        value={form.type}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="main">Main</option>
                                        <option value="branch">Branch</option>
                                    </select>
                                    {formErrors.type?.map((message, index) => (
                                        <p key={index} className="mt-1 text-sm text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>

                                <div>
                                    <label
                                        htmlFor="warehouse-branch"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Assigned Branch
                                    </label>
                                    <select
                                        id="warehouse-branch"
                                        name="branch_id"
                                        value={form.branch_id}
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name} ({branch.code})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.branch_id?.map((message, index) => (
                                        <p key={index} className="mt-1 text-sm text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>
                                    {!isEditMode && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={form.is_active}
                                            onChange={handleFormChange}
                                            className="rounded border-gray-300"
                                        />
                                        Warehouse is active
                                    </label>
                                    {formErrors.is_active?.map((message, index) => (
                                        <p key={index} className="mt-1 text-sm text-red-600">
                                            {message}
                                        </p>
                                    ))}
                                </div>
                                )}

                                <div className="flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={saving}
                                        className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving
                                            ? isEditMode
                                                ? 'Saving...'
                                                : 'Creating...'
                                            : isEditMode
                                                ? 'Save Changes'
                                                : 'Create Warehouse'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
