import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(true);
    const [branchesLoading, setBranchesLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState('');

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptMode, setReceiptMode] = useState('preview');

    const [showVoidModal, setShowVoidModal] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [voidLoading, setVoidLoading] = useState(false);
    const [voidError, setVoidError] = useState('');

    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        search: '',
        branch_id: '',
        payment_method: '',
        status: '',
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const loadBranches = async () => {
        setBranchesLoading(true);

        try {
            const response = await fetch('/api/branches', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load branches.'
                );
            }

            setBranches(result.data ?? []);
        } catch (error) {
            console.error('Failed to load branches:', error);
        } finally {
            setBranchesLoading(false);
        }
    };

    const loadTransactions = async (page = 1, activeFilters = filters) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value !== '') {
                    params.append(key, value);
                }
            });

            params.append('page', page);

            const response = await fetch(
                `/api/transactions?${params.toString()}`,
                {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load transactions.'
                );
            }

            const paginated = result.data;

            setTransactions(paginated?.data ?? []);

            setPagination({
                current_page: paginated?.current_page ?? 1,
                last_page: paginated?.last_page ?? 1,
                total: paginated?.total ?? 0,
            });
        } catch (error) {
            setError(
                error.message || 'Failed to load transaction history.'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTransaction = async (saleId) => {
        setTransactionLoading(true);
        setTransactionError('');
        setSelectedTransaction(null);

        try {
            const response = await fetch(
                    `/api/transactions/${saleId}`,
                    {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load transaction.'
                );
            }

            setSelectedTransaction(result.data);
        } catch (error) {
            setTransactionError(
                error.message || 'Failed to load transaction.'
            );
        } finally {
            setTransactionLoading(false);
        }
    };

    const handleVoidTransaction = async () => {
    const reason = voidReason.trim();

        if (!reason) {
            setVoidError('A void reason is required.');
            return;
        }

        if (!selectedTransaction) {
            return;
        }

        setVoidLoading(true);
        setVoidError('');

        try {
            const response = await fetch(
                `/api/transactions/${selectedTransaction.id}/void`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reason,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to void transaction.'
                );
            }

            setShowVoidModal(false);
            setVoidReason('');

            await loadTransactions(
                pagination.current_page,
                filters
            );

            await loadTransaction(selectedTransaction.id);
        } catch (error) {
            setVoidError(
                error.message || 'Failed to void transaction.'
            );
        } finally {
            setVoidLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
        loadTransactions();
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSearch = (event) => {
        event.preventDefault();

        loadTransactions(1, filters);
    };

    const handleReset = () => {
        const resetFilters = {
            date_from: '',
            date_to: '',
            search: '',
            branch_id: '',
            payment_method: '',
            status: '',
        };

        setFilters(resetFilters);

        loadTransactions(1, resetFilters);
    };

    const handlePageChange = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === pagination.current_page
        ) {
            return;
        }

        loadTransactions(page, filters);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Transaction History
                        </h1>

                        <p className="mt-1 text-sm text-gray-600">
                            View and manage POS transactions.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                        <form onSubmit={handleSearch}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                        name="date_from"
                                        type="date"
                                        value={filters.date_from}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                                        name="date_to"
                                        type="date"
                                        value={filters.date_to}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Transaction Search */}
                                <div>
                                    <label
                                        htmlFor="search"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Transaction Number
                                    </label>

                                    <input
                                        id="search"
                                        name="search"
                                        type="text"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="SALE-..."
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Branch */}
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
                                        value={filters.branch_id}
                                        onChange={handleFilterChange}
                                        disabled={branchesLoading}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            All Branches
                                        </option>

                                        {branches.map((branch) => (
                                            <option
                                                key={branch.id}
                                                value={branch.id}
                                            >
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label
                                        htmlFor="payment_method"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Payment Method
                                    </label>

                                    <select
                                        id="payment_method"
                                        name="payment_method"
                                        value={filters.payment_method}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Payments</option>
                                        <option value="cash">Cash</option>
                                        <option value="gcash">GCash</option>
                                    </select>
                                </div>

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
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="voided">
                                            Voided
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Transaction Table */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">
                                    Transactions
                                </h2>

                                {!loading && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        {pagination.total} transaction
                                        {pagination.total !== 1 ? 's' : ''}
                                        {' '}found
                                    </p>
                                )}
                            </div>
                        </div>

                        {loading && (
                            <div className="px-6 py-10 text-center text-sm text-gray-500">
                                Loading transactions...
                            </div>
                        )}

                        {!loading && error && (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        loadTransactions(
                                            pagination.current_page,
                                            filters
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {!loading && !error && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Transaction
                                                </th>

                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Date / Time
                                                </th>

                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Branch
                                                </th>

                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Staff
                                                </th>

                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Payment
                                                </th>

                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Total
                                                </th>

                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Status
                                                </th>

                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="8"
                                                        className="px-6 py-10 text-center text-sm text-gray-500"
                                                    >
                                                        No transactions found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map(
                                                    (transaction) => {
                                                        const payment =
                                                            transaction
                                                                .payments?.[0];

                                                        const staffName = [
                                                            transaction.user
                                                                ?.first_name,
                                                            transaction.user
                                                                ?.last_name,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ');

                                                        return (
                                                            <tr
                                                                key={
                                                                    transaction.id
                                                                }
                                                                className="hover:bg-gray-50"
                                                            >
                                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                                    {
                                                                        transaction.sale_number
                                                                    }
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                                    {new Date(
                                                                        transaction.created_at
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                                    {
                                                                        transaction
                                                                            .branch
                                                                            ?.name
                                                                    }
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                                    {staffName ||
                                                                        transaction
                                                                            .user
                                                                            ?.username ||
                                                                        '—'}
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                                    <span className="capitalize">
                                                                        {payment?.method ||
                                                                            '—'}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                                    ₱
                                                                    {Number(
                                                                        transaction.total_amount
                                                                    ).toFixed(2)}
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                            transaction.status ===
                                                                            'completed'
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : 'bg-gray-100 text-gray-700'
                                                                        }`}
                                                                    >
                                                                        {transaction.status
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase() +
                                                                            transaction.status.slice(
                                                                                1
                                                                            )}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => loadTransaction(transaction.id)}
                                                                        className="cursor-pointer font-medium text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                                        <p className="text-sm text-gray-600">
                                            Page{' '}
                                            <span className="font-medium">
                                                {pagination.current_page}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">
                                                {pagination.last_page}
                                            </span>
                                        </p>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.current_page -
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    pagination.current_page ===
                                                    1
                                                }
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Previous
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.current_page +
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    pagination.current_page ===
                                                    pagination.last_page
                                                }
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                 
                    
                </div>

                

                {/** Transaction details modal */}

            {selectedTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Transaction Details
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedTransaction.sale_number}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedTransaction(null)}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <span className="text-xl">&times;</span>
                                </button>
                            </div>

                            {transactionLoading && (
                                <div className="px-6 py-10 text-center text-sm text-gray-500">
                                    Loading transaction...
                                </div>
                            )}

                            {transactionError && (
                                <div className="px-6 py-10 text-center">
                                    <p className="text-sm text-red-600">
                                        {transactionError}
                                    </p>
                                </div>
                            )}

                            {!transactionLoading && !transactionError && (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Transaction
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-900">
                                                {selectedTransaction.sale_number}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Date / Time
                                            </p>

                                            <p className="mt-1 text-sm text-gray-900">
                                                {new Date(
                                                    selectedTransaction.created_at
                                                ).toLocaleString()}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Branch
                                            </p>

                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedTransaction.branch?.name || '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Warehouse
                                            </p>

                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedTransaction.warehouse?.name || '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Staff
                                            </p>

                                            <p className="mt-1 text-sm text-gray-900">
                                                {[
                                                    selectedTransaction.user?.first_name,
                                                    selectedTransaction.user?.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') ||
                                                    selectedTransaction.user?.username ||
                                                    '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase text-gray-500">
                                                Status
                                            </p>

                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    selectedTransaction.status === 'voided'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}
                                            >
                                                {selectedTransaction.status === 'voided'
                                                    ? 'VOIDED'
                                                    : 'COMPLETED'}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedTransaction.status === 'voided' && (
                                    <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-red-800">
                                                Void Audit
                                            </h3>

                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs font-medium text-red-700">
                                                    Voided By
                                                </p>

                                                <p className="mt-1 text-sm text-gray-900">
                                                    {selectedTransaction.voided_by
                                                        ? `${selectedTransaction.voided_by.first_name ?? ''} ${
                                                            selectedTransaction.voided_by.last_name ?? ''
                                                        }`.trim()
                                                        : '-'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-red-700">
                                                    Voided At
                                                </p>

                                                <p className="mt-1 text-sm text-gray-900">
                                                    {selectedTransaction.voided_at
                                                        ? new Date(
                                                            selectedTransaction.voided_at
                                                        ).toLocaleString()
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-xs font-medium text-red-700">
                                                Void Reason
                                            </p>

                                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                                                {selectedTransaction.void_reason || '-'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                    <div className="mt-6">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                            Items
                                        </h3>

                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                                            Product
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                                            Qty
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                                            Unit Price
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                                            Subtotal
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-gray-200">
                                                    {selectedTransaction.items?.map(
                                                        (item) => (
                                                            <tr key={item.id}>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {item.product?.name ||
                                                                        '—'}
                                                                </td>

                                                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                                    {item.quantity}
                                                                </td>

                                                                <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                                    ₱
                                                                    {Number(
                                                                        item.unit_price
                                                                    ).toFixed(2)}
                                                                </td>

                                                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                                    ₱
                                                                    {Number(
                                                                        item.subtotal
                                                                    ).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-6 ml-auto max-w-sm space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal</span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.subtotal
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Discount</span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.discount_amount
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                                            <span>Total</span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.total_amount
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                            Payment
                                        </h3>

                                        {selectedTransaction.payments?.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="grid grid-cols-1 gap-4 md:grid-cols-3"
                                            >
                                                <div>
                                                    <p className="text-xs font-medium uppercase text-gray-500">
                                                        Method
                                                    </p>

                                                    <p className="mt-1 text-sm capitalize text-gray-900">
                                                        {payment.method}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-medium uppercase text-gray-500">
                                                        Amount Paid
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-900">
                                                        ₱
                                                        {Number(
                                                            payment.amount
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>

                                                {payment.reference_number && (
                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            GCash Reference
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {
                                                                payment.reference_number
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    

                                    <div className="mt-6 flex justify-end gap-3">
                                        {selectedTransaction.status === 'completed' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVoidReason('');
                                                    setVoidError('');
                                                    setShowVoidModal(true);
                                                }}
                                                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                                            >
                                                Void Transaction
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReceiptMode('preview');
                                                setShowReceipt(true);
                                            }}
                                            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                        >
                                            Receipt Preview
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReceiptMode('reprint');
                                                setShowReceipt(true);
                                            }}
                                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Reprint Receipt
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedTransaction(null)}
                                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}           

                {/** show void modal */}
                {showVoidModal && selectedTransaction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Void Transaction
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {selectedTransaction.sale_number}
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <p className="text-sm text-red-700">
                                    This action will void the transaction and
                                    reverse its inventory deduction.
                                </p>
                            </div>

                            <div className="mt-5">
                                <label
                                    htmlFor="void_reason"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Void Reason
                                </label>

                                <textarea
                                    id="void_reason"
                                    value={voidReason}
                                    onChange={(event) =>
                                        setVoidReason(event.target.value)
                                    }
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Enter the reason for voiding this transaction..."
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-red-500 focus:ring-red-500"
                                    disabled={voidLoading}
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                    A reason is required.
                                </p>
                            </div>

                            {voidError && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3">
                                    <p className="text-sm text-red-600">
                                        {voidError}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowVoidModal(false);
                                    setVoidReason('');
                                    setVoidError('');
                                }}
                                disabled={voidLoading}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleVoidTransaction}
                                disabled={
                                    voidLoading ||
                                    !voidReason.trim()
                                }
                                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {voidLoading
                                    ? 'Voiding...'
                                    : 'Confirm Void'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

                {/** preview modal */} 
                {showReceipt && selectedTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
                        <div className="receipt-print-area bg-white p-6 text-sm text-gray-900">
                            <div className="text-center">
                                <h2 className="text-lg font-bold">
                                    SME POS
                                </h2>

                                <p className="mt-1 font-medium">
                                    {selectedTransaction.branch?.name}
                                </p>

                                {selectedTransaction.branch?.address && (
                                    <p>
                                        {selectedTransaction.branch.address}
                                    </p>
                                )}

                                {selectedTransaction.branch?.contact_number && (
                                    <p>
                                        {selectedTransaction.branch.contact_number}
                                    </p>
                                )}
                            </div>

                            <div className="my-4 border-t border-dashed border-gray-400" />

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Transaction:</span>
                                    <span className="font-medium">
                                        {selectedTransaction.sale_number}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>
                                        {new Date(
                                            selectedTransaction.created_at
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Staff:</span>
                                    <span>
                                        {selectedTransaction.user?.first_name}{' '}
                                        {selectedTransaction.user?.last_name}
                                    </span>
                                </div>
                            </div>

                            {selectedTransaction.status === 'voided' && (
                                <div className="my-4 border-2 border-red-600 px-3 py-3 text-center">
                                    <p className="text-2xl font-black tracking-widest text-red-600">
                                        VOID
                                    </p>

                                    <p className="mt-1 text-sm font-bold uppercase text-red-600">
                                        Voided Transaction
                                    </p>
                                </div>
                            )}

                            <div className="my-4 border-t border-dashed border-gray-400" />

                            <div className="space-y-3">
                                {selectedTransaction.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between gap-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {item.product?.name}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {Number(item.quantity)} × ₱
                                                {Number(item.unit_price).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="font-medium">
                                            ₱{Number(item.subtotal).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="my-4 border-t border-dashed border-gray-400" />

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>
                                        ₱
                                        {Number(
                                            selectedTransaction.subtotal
                                        ).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span>
                                        ₱
                                        {Number(
                                            selectedTransaction.discount_amount
                                        ).toFixed(2)}
                                    </span>
                                </div>

                                <div className="mt-2 flex justify-between text-base font-bold">
                                    <span>Total</span>
                                    <span>
                                        ₱
                                        {Number(
                                            selectedTransaction.total_amount
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="my-4 border-t border-dashed border-gray-400" />

                            {selectedTransaction.payments?.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="space-y-1"
                                >
                                    <div className="flex justify-between">
                                        <span>Payment</span>
                                        <span className="uppercase">
                                            {payment.method}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Amount Paid</span>
                                        <span>
                                            ₱{Number(payment.amount).toFixed(2)}
                                        </span>
                                    </div>

                                    {payment.method === 'gcash' &&
                                        payment.reference_number && (
                                            <div className="flex justify-between gap-4">
                                                <span>GCash Ref.</span>
                                                <span className="text-right">
                                                    {payment.reference_number}
                                                </span>
                                            </div>
                                        )}

                                    {payment.method === 'cash' && (
                                        <div className="flex justify-between">
                                            <span>Change</span>
                                            <span>
                                                ₱
                                                {(
                                                    Number(payment.amount) -
                                                    Number(
                                                        selectedTransaction.total_amount
                                                    )
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="my-4 border-t border-dashed border-gray-400" />

                            {selectedTransaction.status === 'voided' && (
                            <div className="mt-4 border-t-2 border-red-600 pt-4 text-xs">
                                <p className="font-bold uppercase text-red-600">
                                    VOID INFORMATION
                                </p>

                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between gap-4">
                                        <span>Reason</span>
                                        <span className="text-right font-medium">
                                            {selectedTransaction.void_reason || '-'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span>Voided By</span>
                                        <span className="font-medium">
                                            {selectedTransaction.voided_by
                                                ? `${selectedTransaction.voided_by.first_name} ${selectedTransaction.voided_by.last_name}`
                                                : '-'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span>Voided At</span>
                                        <span className="font-medium">
                                            {selectedTransaction.voided_at
                                                ? new Date(
                                                    selectedTransaction.voided_at
                                                ).toLocaleString()
                                                : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                            <div className="text-center text-xs">
                                {selectedTransaction.status === 'voided' ? (
                                    <p className="font-bold text-red-600">
                                        THIS TRANSACTION IS VOID
                                    </p>
                                ) : (
                                    <p className="text-gray-500">
                                        Thank you for your purchase!
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="receipt-print-actions flex justify-end gap-3 border-t border-gray-200 p-4">
                            <button
                                type="button"
                                onClick={() => setShowReceipt(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </AuthenticatedLayout>
    );
}