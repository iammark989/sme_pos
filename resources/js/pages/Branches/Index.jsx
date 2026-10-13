
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [branches, setBranches] = useState([]);
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

    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const [editingBranchId, setEditingBranchId] = useState(null);
    const isEditMode = editingBranchId !== null;

    const [form, setForm] = useState({
        name: '',
        code: '',
        address: '',
        contact_number: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setForm({
            name: '',
            code: '',
            address: '',
            contact_number: '',
            is_active: true,
        });
        setEditingBranchId(null);
        setFormErrors({});
        setSuccessMessage('');
        setShowCreateModal(true);
    };

    const openEditModal = async (branchId) => {
        setEditingBranchId(branchId);
        setFormErrors({});
        setSuccessMessage('');
        setError('');
        setShowCreateModal(true);

        try {
            const response = await axios.get(
                `/api/branch-management/${branchId}`,
            );

            const branch = response.data.data;

            setForm({
                name: branch.name ?? '',
                code: branch.code ?? '',
                address: branch.address ?? '',
                contact_number: branch.contact_number ?? '',
                is_active: Boolean(branch.is_active),
            });
        } catch (err) {
            setShowCreateModal(false);
            setEditingBranchId(null);

            setError(
                err.response?.data?.message ||
                    'Unable to load branch details. Please try again.',
            );
        }
    };

    const handleUpdateBranch = async (event) => {
        event.preventDefault();

        if (!editingBranchId) return;

        setSaving(true);
        setFormErrors({});
        setSuccessMessage('');

        try {
            await axios.put(
                `/api/branch-management/${editingBranchId}`,
                form,
            );

            setShowCreateModal(false);
            setEditingBranchId(null);
            setSuccessMessage('Branch updated successfully.');

            await loadBranches(pagination.current_page);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(
                    err.response.data.errors ?? {
                        general:
                            err.response.data.message ||
                            'Please check the submitted information.',
                    },
                );
            } else {
                setFormErrors({
                    general:
                        err.response?.data?.message ||
                        'Unable to update branch. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    
    const handleToggleBranchStatus = async (branch) => {
        const nextIsActive = !branch.is_active;
        const action = nextIsActive ? 'activate' : 'deactivate';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} branch "${branch.name}"?`
        );

        if (!confirmed) return;

        setUpdatingStatusId(branch.id);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.patch(
                `/api/branch-management/${branch.id}/status`,
                {
                    is_active: nextIsActive,
                }
            );

            setSuccessMessage(
                response.data.message ||
                    `Branch ${nextIsActive ? 'activated' : 'deactivated'} successfully.`
            );

            await loadBranches(pagination.current_page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    `Unable to ${action} branch. Please try again.`
            );
        } finally {
            setUpdatingStatusId(null);
        }
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

    const handleCreateBranch = async (event) => {
        event.preventDefault();

        setSaving(true);
        setFormErrors({});
        setSuccessMessage('');

        try {
            await axios.post('/api/branch-management', form);

            setShowCreateModal(false);
            setSuccessMessage('Branch created successfully.');

            await loadBranches(1);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(
                    err.response.data.errors ?? {
                        general:
                            err.response.data.message ||
                            'Please check the submitted information.',
                    },
                );
            } else {
                setFormErrors({
                    general:
                        err.response?.data?.message ||
                        'Unable to create branch. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const loadBranches = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('/api/branch-management', {
                params: { page },
            });

            const paginator = response.data.data;

            setBranches(paginator.data ?? []);
            setPagination({
                current_page: paginator.current_page,
                last_page: paginator.last_page,
                total: paginator.total,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Unable to load branches. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Branch Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage branch locations and their status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Create Branch
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
                            Branches
                        </h2>
                        <span className="text-sm text-gray-500">
                            {pagination.total} total
                        </span>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            Loading branches...
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            No branches found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            'Branch Name',
                                            'Code',
                                            'Contact Number',
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
                                    {branches.map((branch) => (
                                        <tr
                                            key={branch.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {branch.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {branch.code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {branch.contact_number || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {branch.is_active ? (
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
                                                        onClick={() => openEditModal(branch.id)}
                                                        className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleBranchStatus(branch)}
                                                        disabled={updatingStatusId !== null}
                                                        className={`cursor-pointer rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            branch.is_active
                                                                ? 'border-red-200 text-red-700 hover:bg-red-50'
                                                                : 'border-green-200 text-green-700 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {updatingStatusId === branch.id
                                                            ? 'Updating...'
                                                            : branch.is_active
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
                                        loadBranches(pagination.current_page - 1)
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
                                        loadBranches(pagination.current_page + 1)
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
                                    {isEditMode ? 'Edit Branch' : 'Create Branch'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {isEditMode
                                    ? 'Update the branch details.'
                                    : 'Enter the new branch details.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="cursor-pointer rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={isEditMode ? handleUpdateBranch : handleCreateBranch}
                            className="space-y-5 p-6"
                        >
                            {formErrors.general && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formErrors.general}
                                </div>
                            )}

                            {[
                                ['name', 'Branch Name', true],
                                ['code', 'Branch Code', true],
                                ['contact_number', 'Contact Number', false],
                            ].map(([name, label, required]) => (
                                <div key={name}>
                                    <label
                                        htmlFor={name}
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        {label}
                                    </label>

                                    <input
                                        id={name}
                                        name={name}
                                        value={form[name]}
                                        onChange={handleFormChange}
                                        required={required}
                                        maxLength={name === 'code' ? 50 : 255}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />

                                    {formErrors[name]?.map((message, index) => (
                                        <p
                                            key={index}
                                            className="mt-1 text-sm text-red-600"
                                        >
                                            {message}
                                        </p>
                                    ))}
                                </div>
                            ))}

                            <div>
                                <label
                                    htmlFor="address"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Address
                                </label>

                                <textarea
                                    id="address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleFormChange}
                                    rows={3}
                                    maxLength={1000}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />

                                {formErrors.address?.map((message, index) => (
                                    <p
                                        key={index}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {message}
                                    </p>
                                ))}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={form.is_active}
                                        onChange={handleFormChange}
                                        className="rounded border-gray-300"
                                    />
                                    Branch is active
                                </label>

                                {formErrors.is_active?.map((message, index) => (
                                    <p
                                        key={index}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {message}
                                    </p>
                                ))}
                            </div>

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
                                        : 'Create Branch'}
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
