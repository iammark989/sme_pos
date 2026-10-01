import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusFilter, setStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [branches, setBranches] = useState([]);

    const [userFilter, setUserFilter] = useState('');
    const [staff, setStaff] = useState([]);

    const [selectedShift, setSelectedShift] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadShifts = async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            if (branchFilter) {
                params.append('branch_id', branchFilter);
            }

            if (userFilter) {
                params.append('user_id', userFilter);
            }

            if (dateFrom) {
                params.append('date_from', dateFrom);
            }

            if (dateTo) {
                params.append('date_to', dateTo);
            }

            params.append('page', page);
            params.append('per_page', '20');

            const response = await fetch(
                `/api/shifts?${params.toString()}`,
                {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to load shift history.'
                );
            }

            setShifts(data.data?.data ?? []);

            setPagination({
                current_page: data.data?.current_page ?? 1,
                last_page: data.data?.last_page ?? 1,
                per_page: data.data?.per_page ?? 20,
                total: data.data?.total ?? 0,
            });

            setStaff(data.meta?.staff ?? []);
        } catch (err) {
            setError(err.message || 'Failed to load shift history.');
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to load branches.'
                );
            }

            setBranches(data.data ?? []);
        } catch (err) {
            console.error('Failed to load branches:', err);
        }
    };

    const handleApplyFilters = () => {
        loadShifts(1);
    };

    const handleResetFilters = () => {
        setStatusFilter('');
        setBranchFilter('');
        setUserFilter('');
        setDateFrom('');
        setDateTo('');

        setTimeout(() => {
            loadShifts(1);
        }, 0);
    };

    const loadShiftDetails = async (shiftId) => {
        setDetailsLoading(true);
        setDetailsError('');
        setSelectedShift(null);
        setShowDetails(true);

        try {
            const response = await fetch(`/api/shifts/${shiftId}`, {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to load shift details.'
                );
            }

            setSelectedShift(data.data);
        } catch (err) {
            setDetailsError(
                err.message || 'Failed to load shift details.'
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        loadShifts();
        loadBranches();
    }, []);

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleString();
    };

    const formatCurrency = (value) => {
        return `₱${Number(value ?? 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getUserName = (user) => {
        if (!user) {
            return '-';
        }

        return [user.first_name, user.last_name]
            .filter(Boolean)
            .join(' ') || user.username;
    };

    const getVarianceClass = (variance) => {
        const value = Number(variance ?? 0);

        if (value > 0) {
            return 'text-green-600';
        }

        if (value < 0) {
            return 'text-red-600';
        }

        return 'text-gray-700';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Shift History" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Shift History
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            View completed and active staff shifts and cash
                            reconciliation.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-red-700">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={loadShifts}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

                            {/* Status */}
                            <div>
                                <label
                                    htmlFor="status"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Status
                                </label>

                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            {/* Branch */}
                            <div>
                                <label
                                    htmlFor="branch"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Branch
                                </label>

                                <select
                                    id="branch"
                                    value={branchFilter}
                                    onChange={(e) => setBranchFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All Branches</option>

                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Staff */}
                            <div>
                                <label
                                    htmlFor="staff"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Staff
                                </label>

                                <select
                                    id="staff"
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All Staff</option>

                                    {staff.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {[user.first_name, user.last_name]
                                                .filter(Boolean)
                                                .join(' ') || user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label
                                    htmlFor="date_from"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Date From
                                </label>

                                <input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label
                                    htmlFor="date_to"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Date To
                                </label>

                                <input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>

                            <button
                                type="button"
                                onClick={handleApplyFilters}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">

                        {/* Loading */}
                        {loading ? (
                            <div className="flex items-center justify-center px-6 py-16">
                                <div className="text-sm text-gray-500">
                                    Loading shift history...
                                </div>
                            </div>
                        ) : shifts.length === 0 ? (
                            /* Empty */
                            <div className="px-6 py-16 text-center">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    No shifts found
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    There are no shift records to display.
                                </p>
                            </div>
                        ) : (
                            /* Table */
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Staff
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Branch
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Warehouse
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Opened
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Closed
                                            </th>

                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Expected Cash
                                            </th>

                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Actual Cash
                                            </th>

                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Variance
                                            </th>

                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {shifts.map((shift) => (
                                            <tr
                                                key={shift.id}
                                                className="hover:bg-gray-50"
                                            >
                                                {/* Staff */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {getUserName(shift.user)}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        @{shift.user?.username}
                                                    </div>
                                                </td>

                                                {/* Branch */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {shift.branch?.name ?? '-'}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {shift.branch?.code ?? '-'}
                                                    </div>
                                                </td>

                                                {/* Warehouse */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {shift.warehouse?.name ?? '-'}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {shift.warehouse?.code ?? '-'}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            shift.status === 'open'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {shift.status
                                                            ?.charAt(0)
                                                            .toUpperCase() +
                                                            shift.status?.slice(
                                                                1
                                                            )}
                                                    </span>
                                                </td>

                                                {/* Opened */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        shift.opened_at
                                                    )}
                                                </td>

                                                {/* Closed */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                    {formatDateTime(
                                                        shift.closed_at
                                                    )}
                                                </td>

                                                {/* Expected Cash */}
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                    {formatCurrency(
                                                        shift.expected_cash
                                                    )}
                                                </td>

                                                {/* Actual Cash */}
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                                                    {shift.actual_cash !== null
                                                        ? formatCurrency(
                                                              shift.actual_cash
                                                          )
                                                        : '-'}
                                                </td>

                                                {/* Variance */}
                                                <td
                                                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getVarianceClass(
                                                        shift.cash_variance
                                                    )}`}
                                                >
                                                    {shift.cash_variance !== null
                                                        ? formatCurrency(
                                                              shift.cash_variance
                                                          )
                                                        : '-'}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => loadShiftDetails(shift.id)}
                                                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                    </div>
                    {/* Pagination */}
                    {!loading && pagination.total > 0 && (
                        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">

                            <div className="text-sm text-gray-600">
                                Showing{' '}
                                <span className="font-medium text-gray-900">
                                    {(pagination.current_page - 1) *
                                        pagination.per_page +
                                        1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-gray-900">
                                    {Math.min(
                                        pagination.current_page * pagination.per_page,
                                        pagination.total
                                    )}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-gray-900">
                                    {pagination.total}
                                </span>{' '}
                                shifts
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        loadShifts(pagination.current_page - 1)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="px-2 text-sm text-gray-600">
                                    Page {pagination.current_page} of{' '}
                                    {pagination.last_page}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        loadShifts(pagination.current_page + 1)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                    
                </div>
                {/* Shift Details Modal */}
{showDetails && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Shift Details
                    </h2>

                    {selectedShift?.shift?.id && (
                        <p className="text-sm text-gray-500">
                            Shift #{selectedShift.shift.id}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setShowDetails(false);
                        setSelectedShift(null);
                        setDetailsError('');
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            {/* Loading */}
            {detailsLoading && (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">
                        Loading shift details...
                    </p>
                </div>
            )}

            {/* Error */}
            {!detailsLoading && detailsError && (
                <div className="px-6 py-8">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-700">
                            {detailsError}
                        </p>
                    </div>
                </div>
            )}

            {/* Details */}
            {!detailsLoading &&
                !detailsError &&
                selectedShift && (
                    <div className="space-y-6 p-6">

                        {/* Shift Information */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Shift Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Staff
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {getUserName(
                                            selectedShift.shift.user
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Branch
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {selectedShift.shift.branch?.name ??
                                            '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Warehouse
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {selectedShift.shift.warehouse?.name ??
                                            '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Status
                                    </p>

                                    <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                                        {selectedShift.shift.status}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Opened
                                    </p>

                                    <p className="mt-1 text-sm text-gray-900">
                                        {formatDateTime(
                                            selectedShift.shift.opened_at
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Closed
                                    </p>

                                    <p className="mt-1 text-sm text-gray-900">
                                        {formatDateTime(
                                            selectedShift.shift.closed_at
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cash Reconciliation */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Cash Reconciliation
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Opening Cash
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(
                                            selectedShift.summary
                                                .opening_cash
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Expected Cash
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(
                                            selectedShift.summary
                                                .expected_cash
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Actual Cash
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {selectedShift.summary.actual_cash !==
                                        null
                                            ? formatCurrency(
                                                  selectedShift.summary
                                                      .actual_cash
                                              )
                                            : '-'}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Variance
                                    </p>

                                    <p
                                        className={`mt-1 text-lg font-semibold ${getVarianceClass(
                                            selectedShift.summary
                                                .cash_variance
                                        )}`}
                                    >
                                        {selectedShift.summary
                                            .cash_variance !== null
                                            ? formatCurrency(
                                                  selectedShift.summary
                                                      .cash_variance
                                              )
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sales Summary */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Sales Summary
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Transactions
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {
                                            selectedShift.summary
                                                .transaction_count
                                        }
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Total Sales
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(
                                            selectedShift.summary.total_sales
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        Cash Sales
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(
                                            selectedShift.summary.cash_sales
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-gray-500">
                                        GCash Sales
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(
                                            selectedShift.summary.gcash_sales
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Transactions
                                </h3>

                                <span className="text-sm text-gray-500">
                                    {selectedShift.transactions?.length ?? 0} transaction
                                    {(selectedShift.transactions?.length ?? 0) !== 1
                                        ? 's'
                                        : ''}
                                </span>
                            </div>

                            {selectedShift.transactions?.length > 0 ? (
                                <div className="overflow-hidden rounded-lg border">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Transaction
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Date / Time
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Payment
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Status
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {selectedShift.transactions.map(
                                                    (transaction) => (
                                                        <tr
                                                            key={transaction.id}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            {/* Transaction */}
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {transaction.sale_number}
                                                                </div>

                                                                <div className="text-xs text-gray-500">
                                                                    ID: #{transaction.id}
                                                                </div>
                                                            </td>

                                                            {/* Date / Time */}
                                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                                {formatDateTime(
                                                                    transaction.created_at
                                                                )}
                                                            </td>

                                                            {/* Payment */}
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <span className="text-sm font-medium capitalize text-gray-700">
                                                                    {transaction.payment_method ??
                                                                        '-'}
                                                                </span>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                        transaction.status ===
                                                                        'completed'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : transaction.status ===
                                                                            'voided'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                    }`}
                                                                >
                                                                    {transaction.status
                                                                        ?.charAt(0)
                                                                        .toUpperCase() +
                                                                        transaction.status?.slice(1)}
                                                                </span>
                                                            </td>

                                                            {/* Amount */}
                                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                                {formatCurrency(
                                                                    transaction.total_amount
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                                    <p className="text-sm text-gray-500">
                                        No completed transactions for this shift.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                Notes
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">
                                        Opening Notes
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                        {selectedShift.shift.opening_notes ||
                                            'No opening notes.'}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs font-medium text-gray-500">
                                        Closing Notes
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                        {selectedShift.shift.closing_notes ||
                                            'No closing notes.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Modal Footer */}
                            <div className="flex justify-end border-t px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDetails(false);
                                        setSelectedShift(null);
                                        setDetailsError('');
                                    }}
                                    className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
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