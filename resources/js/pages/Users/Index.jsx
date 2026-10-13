
import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePage } from '@inertiajs/react';

export default function Index() {
    const { auth } = usePage().props;
    const [users, setUsers] = useState([]);
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
    const [branches, setBranches] = useState([]);

    const [deactivatingUserId, setDeactivatingUserId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('')

    const [editingUserId, setEditingUserId] = useState(null);
    const isEditMode = editingUserId !== null;

    const openEditModal = async (userId) => {
        setFormErrors({});
        setSaving(false);
        setEditingUserId(userId);
        setShowCreateModal(true);

        try {
            const [userResponse, branchesResponse] = await Promise.all([
                axios.get(`/api/users/${userId}`),
                axios.get('/api/branches'),
            ]);

            const user = userResponse.data.data;
            const availableBranches = branchesResponse.data.data ?? [];

            setBranches(availableBranches);

            setForm({
                first_name: user.first_name ?? '',
                middle_name: user.middle_name ?? '',
                last_name: user.last_name ?? '',
                suffix: user.suffix ?? '',
                username: user.username ?? '',
                email: user.email ?? '',
                password: '',
                role_id: String(user.role_id),
                branch_id: user.branch_id ? String(user.branch_id) : '',
                is_active: Boolean(user.is_active),
                is_global_admin: Boolean(user.is_global_admin),
            });
        } catch (err) {
            setShowCreateModal(false);
            setEditingUserId(null);

            setError(
                err.response?.data?.message ||
                    'Unable to load user details. Please try again.',
            );
        }
    };

    const handleUpdateUser = async (event) => {
        event.preventDefault();

        if (!editingUserId) return;

        setSaving(true);
        setFormErrors({});

        const payload = {
            ...form,
            role_id: Number(form.role_id),
            branch_id:
                form.is_global_admin && Number(form.role_id) === 2
                    ? null
                    : form.branch_id
                    ? Number(form.branch_id)
                    : null,
        };

        // An empty password means keep the current password.
        if (!payload.password) {
            delete payload.password;
        }

        try {
            await axios.put(`/api/users/${editingUserId}`, payload);

            setShowCreateModal(false);
            setEditingUserId(null);

            await loadUsers(pagination.current_page);
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
                        'Unable to update user. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivateUser = async (user) => {
        const name = fullName(user) || user.username;

        const confirmed = window.confirm(
            `Are you sure you want to deactivate ${name}?\n\n` +
            'This user will be marked as inactive. Their record will not be deleted.',
        );

        if (!confirmed) return;

        setDeactivatingUserId(user.id);
        setError('');
        setSuccessMessage('');

        try {
            await axios.delete(`/api/users/${user.id}`);

            setSuccessMessage(`${name} has been deactivated successfully.`);

            await loadUsers(pagination.current_page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Unable to deactivate this user. Please try again.',
            );
        } finally {
            setDeactivatingUserId(null);
        }
    };

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        username: '',
        email: '',
        password: '',
        role_id: '4',
        branch_id: '',
        is_active: true,
        is_global_admin: false,
    });

    const loadUsers = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('/api/users', {
                params: { page },
            });

            const paginator = response.data.data;

            setUsers(paginator.data ?? []);
            setPagination({
                current_page: paginator.current_page,
                last_page: paginator.last_page,
                total: paginator.total,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load users. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const fullName = (user) =>
        [
            user.first_name,
            user.middle_name,
            user.last_name,
            user.suffix,
        ]
            .filter(Boolean)
            .join(' ');

    const roleOptions = [
        { id: 2, name: 'Admin' },
        { id: 3, name: 'Accounting' },
        { id: 4, name: 'Staff' },
    ];

    const openCreateModal = async () => {
        setForm({
            first_name: '',
            middle_name: '',
            last_name: '',
            suffix: '',
            username: '',
            email: '',
            password: '',
            role_id: '4',
            branch_id: '',
            is_active: true,
            is_global_admin: false,
        });

        setFormErrors({});
        setShowCreateModal(true);

        try {
            const response = await axios.get('/api/branches');
            setBranches(response.data.data ?? []);
        } catch (err) {
            setFormErrors({
                branches: 'Unable to load branches. Please try again.',
            });
        }
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => {
            const updated = {
                ...previous,
                [name]: type === 'checkbox' ? checked : value,
            };

            if (name === 'role_id' && value !== '2') {
                updated.is_global_admin = false;
                updated.branch_id = '';
            }

            if (name === 'is_global_admin' && checked) {
                updated.branch_id = '';
            }

            return updated;
        });

        setFormErrors((previous) => ({
            ...previous,
            [name]: undefined,
            general: undefined,
        }));
    };

    const handleCreateUser = async (event) => {
        event.preventDefault();

        setSaving(true);
        setFormErrors({});

        const payload = {
            ...form,
            role_id: Number(form.role_id),
            branch_id:
                form.is_global_admin && Number(form.role_id) === 2
                    ? null
                    : form.branch_id
                    ? Number(form.branch_id)
                    : null,
        };

        try {
            await axios.post('/api/users', payload);

            setShowCreateModal(false);
            await loadUsers(1);
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors ?? {
                    general:
                        err.response.data.message ||
                        'Please check the submitted information.',
                });
            } else {
                setFormErrors({
                    general:
                        err.response?.data?.message ||
                        'Unable to create user. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const closeModal = async() =>{
        setShowCreateModal(false);
        setEditingUserId(null);
    }

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            User Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage user accounts, roles, and branch assignments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Create User
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
                            Users
                        </h2>
                        <span className="text-sm text-gray-500">
                            {pagination.total} total
                        </span>
                    </div>

                    {loading ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            No users found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            'User',
                                            'Username',
                                            'Email',
                                            'Role',
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
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {fullName(user)}
                                                {user.is_global_admin && (
                                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                                        Global Admin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.username}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.email}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.role?.name ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {user.branch?.name ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {user.is_active ? (
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
                                                        onClick={() => openEditModal(user.id)}
                                                        className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    {user.is_active ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeactivateUser(user)}
                                                            disabled={deactivatingUserId === user.id}
                                                            className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {deactivatingUserId === user.id
                                                                ? 'Deactivating...'
                                                                : 'Deactivate'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">
                                                            Deactivated
                                                        </span>
                                                    )}
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
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() => loadUsers(pagination.current_page - 1)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={pagination.current_page >= pagination.last_page}
                                    onClick={() => loadUsers(pagination.current_page + 1)}
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
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {isEditMode ? 'Edit User' : 'Create User'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {isEditMode
                                        ? 'Update the selected user account.'
                                        : 'Add a new SME POS user account.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="cursor-pointer rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={isEditMode ? handleUpdateUser : handleCreateUser}
                            className="space-y-6 p-6"
                        >
                            {formErrors.general && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formErrors.general}
                                </div>
                            )}

                            {formErrors.branches && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formErrors.branches}
                                </div>
                            )}

                            <div>
                                <h3 className="mb-3 font-semibold text-gray-800">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        ['first_name', 'First Name', true],
                                        ['middle_name', 'Middle Name', false],
                                        ['last_name', 'Last Name', true],
                                        ['suffix', 'Suffix', false],
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
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 font-semibold text-gray-800">
                                    Account Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        ['username', 'Username', 'text'],
                                        ['email', 'Email Address', 'email'],
                                        ['password', 'Password', 'password'],
                                    ].map(([name, label, type]) => (
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
                                                type={type}
                                                value={form[name]}
                                                onChange={handleFormChange}
                                                required={name !== 'password' || !isEditMode}
                                                minLength={name === 'password' ? 8 : undefined}
                                                autoComplete={
                                                    name === 'password'
                                                        ? 'new-password'
                                                        : undefined
                                                }
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
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 font-semibold text-gray-800">
                                    Role and Branch Assignment
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="role_id"
                                            className="mb-1 block text-sm font-medium text-gray-700"
                                        >
                                            Role
                                        </label>
                                        <select
                                            id="role_id"
                                            name="role_id"
                                            value={form.role_id}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        >
                                            {roleOptions.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.role_id?.map((message, index) => (
                                            <p key={index} className="mt-1 text-sm text-red-600">
                                                {message}
                                            </p>
                                        ))}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="branch_id"
                                            className="mb-1 block text-sm font-medium text-gray-700"
                                        >
                                            Branch
                                        </label>
                                        <select
                                            id="branch_id"
                                            name="branch_id"
                                            value={form.branch_id}
                                            onChange={handleFormChange}
                                            disabled={
                                                form.is_global_admin &&
                                                Number(form.role_id) === 2
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                                        >
                                            <option value="">Select branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.branch_id?.map((message, index) => (
                                            <p key={index} className="mt-1 text-sm text-red-600">
                                                {message}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {formErrors.is_global_admin?.map((message, index) => (
                                    <p key={index} className="mt-1 text-sm text-red-600">
                                        {message}
                                    </p>
                                ))}

                                {form.role_id === '2' && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Global Admin access is only available to Owners.
                                    </p>
                                )}

                                <div className="mt-4 space-y-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={form.is_active}
                                            onChange={handleFormChange}
                                            className="rounded border-gray-300"
                                        />
                                        Account is active
                                    </label>

                                    {form.role_id === '2' && auth?.user?.role?.name === 'Owner' && (
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                name="is_global_admin"
                                                checked={form.is_global_admin}
                                                onChange={handleFormChange}
                                                className="rounded border-gray-300"
                                            />
                                            Grant Global Admin access
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
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
                                        : 'Create User'}
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
