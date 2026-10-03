import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [warehouses, setWarehouses] = useState([]);

    const [search, setSearch] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [type, setType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadWarehouses = async () => {
        try {
            const response = await axios.get('/api/warehouses');

            const result = response.data.data;

            setWarehouses(
                Array.isArray(result)
                    ? result
                    : result?.data ?? []
            );
        } catch (error) {
            console.error('Failed to load warehouses:', error);
            setWarehouses([]);
        }
    };

    const loadTransactions = async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const params = {
                page,
                per_page: 20,
            };

            if (search.trim() !== '') {
                params.search = search.trim();
            }

            if (warehouseId !== '') {
                params.warehouse_id = warehouseId;
            }

            if (type !== '') {
                params.type = type;
            }

            if (dateFrom !== '') {
                params.date_from = dateFrom;
            }

            if (dateTo !== '') {
                params.date_to = dateTo;
            }

            const response = await axios.get(
                '/api/inventory/transactions',
                { params }
            );

            const result = response.data.data;

            setTransactions(result?.data ?? []);
            setPagination(result ?? null);
        } catch (error) {
            console.error(
                'Failed to load inventory transactions:',
                error
            );

            setError(
                error.response?.data?.message ||
                    'Failed to load inventory transactions.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWarehouses();
        loadTransactions();
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        loadTransactions(1);
    };

    const handleReset = () => {
        setSearch('');
        setWarehouseId('');
        setType('');
        setDateFrom('');
        setDateTo('');

        setTimeout(() => {
            loadTransactions(1);
        }, 0);
    };

    const handlePageChange = (page) => {
        if (
            !pagination ||
            page < 1 ||
            page > pagination.last_page
        ) {
            return;
        }

        loadTransactions(page);
    };

    const formatQuantity = (quantity) => {
        return Number(quantity).toLocaleString(undefined, {
            maximumFractionDigits: 3,
        });
    };

    const formatDateTime = (date) => {
        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleString();
    };

    const getCategoryClasses = (category) => {
        switch (category) {
            case 'Stock In':
                return 'bg-green-100 text-green-700';

            case 'Sale':
                return 'bg-blue-100 text-blue-700';

            case 'Sale Reversal':
                return 'bg-orange-100 text-orange-700';

            case 'Adjustment':
                return 'bg-yellow-100 text-yellow-700';

            case 'Transfer':
                return 'bg-purple-100 text-purple-700';

            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <AuthenticatedLayout>
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Inventory Transaction History
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View inventory movements and transaction history
                    across warehouses.
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearchSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-6"
                >
                    {/* Search */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Search Inventory
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Name or SKU"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Warehouse */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Warehouse
                        </label>

                        <select
                            value={warehouseId}
                            onChange={(event) =>
                                setWarehouseId(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">
                                All Warehouses
                            </option>

                            {warehouses.map((warehouse) => (
                                <option
                                    key={warehouse.id}
                                    value={warehouse.id}
                                >
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Transaction Type
                        </label>

                        <select
                            value={type}
                            onChange={(event) =>
                                setType(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">
                                All Types
                            </option>

                            <option value="stock_in">
                                Stock In
                            </option>

                            <option value="sale">
                                Sale
                            </option>

                            <option value="sale_reversal">
                                Sale Reversal
                            </option>

                            <option value="adjustment">
                                Adjustment
                            </option>

                            <option value="transfer_out">
                                Transfer Out
                            </option>

                            <option value="transfer_in">
                                Transfer In
                            </option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Date From
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                                setDateFrom(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Date To
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) =>
                                setDateTo(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-end gap-2 md:col-span-6">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">
                        {error}
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Inventory Item
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Warehouse
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Type
                                </th>

                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Quantity
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Reference
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Notes
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        No inventory transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {/* Date */}
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                                            {formatDateTime(
                                                transaction.created_at
                                            )}
                                        </td>

                                        {/* Inventory Item */}
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {transaction.inventory_item
                                                    ?.name ?? '-'}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {transaction.inventory_item
                                                    ?.sku ?? '-'}
                                            </div>
                                        </td>

                                        {/* Warehouse */}
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-900">
                                                {transaction.warehouse?.name ??
                                                    '-'}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {transaction.warehouse?.code ??
                                                    '-'}
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryClasses(
                                                    transaction.transaction_category
                                                )}`}
                                            >
                                                {transaction.transaction_category ??
                                                    'Other'}
                                            </span>
                                        </td>

                                        {/* Quantity */}
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900">
                                            {formatQuantity(
                                                transaction.quantity
                                            )}{' '}
                                            {transaction.inventory_item?.uom
                                                ?.abbreviation ?? ''}
                                        </td>

                                        {/* Reference */}
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {transaction.reference_type &&
                                            transaction.reference_id ? (
                                                <span>
                                                    {
                                                        transaction.reference_type
                                                    } #
                                                    {
                                                        transaction.reference_id
                                                    }
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>

                                        {/* Notes */}
                                        <td className="max-w-xs px-4 py-4 text-sm text-gray-600">
                                            <div className="truncate">
                                                {transaction.notes || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-500">
                            Showing{' '}
                            <span className="font-medium">
                                {pagination.from ?? 0}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                                {pagination.to ?? 0}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium">
                                {pagination.total ?? 0}
                            </span>{' '}
                            transactions
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!pagination.prev_page_url}
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page - 1
                                    )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>

                            <span className="px-2 text-sm text-gray-600">
                                Page {pagination.current_page} of{' '}
                                {pagination.last_page}
                            </span>

                            <button
                                type="button"
                                disabled={!pagination.next_page_url}
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page + 1
                                    )
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