import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function Index() {
    const [stocks, setStocks] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [warehouses, setWarehouses] = useState([]);

    const [search, setSearch] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [lowStock, setLowStock] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [inventoryItems, setInventoryItems] = useState([]);

    const [showStockInModal, setShowStockInModal] = useState(false);
    const [stockInWarehouseId, setStockInWarehouseId] = useState('');
    const [stockInInventoryItemId, setStockInInventoryItemId] = useState('');
    const [stockInQuantity, setStockInQuantity] = useState('');
    const [stockInNotes, setStockInNotes] = useState('');
    const [stockInLoading, setStockInLoading] = useState(false);
    const [stockInError, setStockInError] = useState('');

    const loadInventoryItems = async () => {
        try {
            const response = await axios.get('/api/inventory-items');

            const result = response.data.data;

            setInventoryItems(
                Array.isArray(result)
                    ? result
                    : result?.data ?? []
            );
        } catch (error) {
            console.error('Failed to load inventory items:', error);
            setInventoryItems([]);
        }
    };

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

    const loadInventory = async (page = 1) => {
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

            if (lowStock) {
                params.low_stock = 1;
            }

            const response = await axios.get('/api/inventory/stocks', {
                params,
            });

            const result = response.data.data;

            setStocks(result?.data ?? []);
            setPagination(result ?? null);
        } catch (error) {
            console.error('Failed to load inventory:', error);

            setError(
                error.response?.data?.message ||
                    'Failed to load inventory.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleStockIn = async (event) => {
        event.preventDefault();

        setStockInError('');
        setStockInLoading(true);

        try {
            await axios.post('/api/inventory/stock-in', {
                warehouse_id: stockInWarehouseId,
                inventory_item_id: stockInInventoryItemId,
                quantity: stockInQuantity,
                notes: stockInNotes.trim() || null,
            });

            setShowStockInModal(false);

            setStockInWarehouseId('');
            setStockInInventoryItemId('');
            setStockInQuantity('');
            setStockInNotes('');
            setStockInError('');

            await loadInventory(pagination?.current_page ?? 1);
        } catch (error) {
            console.error('Failed to stock in:', error);

            setStockInError(
                error.response?.data?.message ||
                    'Failed to stock in inventory.'
            );
        } finally {
            setStockInLoading(false);
        }
    };

    useEffect(() => {
        loadWarehouses();
        loadInventoryItems();
    }, []);

    useEffect(() => {
        loadInventory();
    }, [warehouseId, lowStock]);

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        loadInventory(1);
    };

    const handleReset = () => {
        setSearch('');
        setWarehouseId('');
        setLowStock(false);
    };

    const handlePageChange = (page) => {
        if (!pagination || page < 1 || page > pagination.last_page) {
            return;
        }

        loadInventory(page);
    };

    const formatQuantity = (quantity) => {
        return Number(quantity).toLocaleString(undefined, {
            maximumFractionDigits: 3,
        });
    };

    const getWarehouseName = (stock) => {
        return stock.warehouse?.name ?? '-';
    };

    const getUom = (stock) => {
        return stock.inventory_item?.uom?.abbreviation ?? '-';
    };

    return (
        <AuthenticatedLayout>
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Inventory
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            View current inventory stock across warehouses.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setStockInError('');
                            setShowStockInModal(true);
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Stock In
                    </button>
                </div>

            {/* Filters */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearchSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-4"
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
                            placeholder="Search by item name or SKU..."
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Warehouses</option>

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

                    {/* Low Stock */}
                    <div className="flex items-end">
                        <label className="flex cursor-pointer items-center gap-2 pb-2">
                            <input
                                type="checkbox"
                                checked={lowStock}
                                onChange={(event) =>
                                    setLowStock(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="text-sm font-medium text-gray-700">
                                Low Stock Only
                            </span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-end gap-2 md:col-span-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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

            {/* Inventory Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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

                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Warehouse
                                </th>

                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Stock
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    UOM
                                </th>

                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading inventory...
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-gray-500"
                                    >
                                        No inventory records found.
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => {
                                    const isLowStock =
                                        stock.is_low_stock === true;

                                    return (
                                        <tr
                                            key={stock.id}
                                            className={
                                                isLowStock
                                                    ? 'bg-red-50'
                                                    : 'hover:bg-gray-50'
                                            }
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {stock.inventory_item
                                                        ?.name ?? '-'}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {stock.inventory_item
                                                        ?.sku ?? '-'}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {getWarehouseName(stock)}
                                                </div>

                                                {stock.warehouse?.branch && (
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            stock.warehouse
                                                                .branch.name
                                                        }
                                                    </div>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        isLowStock
                                                            ? 'text-red-700'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {formatQuantity(
                                                        stock.quantity
                                                    )}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {getUom(stock)}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                {isLowStock ? (
                                                    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading &&
                    pagination &&
                    pagination.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-500">
                                Showing{' '}
                                <span className="font-medium text-gray-700">
                                    {pagination.from ?? 0}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-gray-700">
                                    {pagination.to ?? 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-gray-700">
                                    {pagination.total ?? 0}
                                </span>{' '}
                                items
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.current_page - 1
                                        )
                                    }
                                    disabled={pagination.current_page === 1}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
            </div>

            {/** stock-in modal */}
            {showStockInModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Stock In
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Add inventory stock to a warehouse.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowStockInModal(false)}
                            disabled={stockInLoading}
                            className="text-2xl leading-none text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleStockIn}>
                        <div className="space-y-4 px-6 py-5">
                            {stockInError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {stockInError}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Warehouse
                                </label>

                                <select
                                    value={stockInWarehouseId}
                                    onChange={(event) =>
                                        setStockInWarehouseId(event.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">
                                        Select Warehouse
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

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Inventory Item
                                </label>

                                <select
                                    value={stockInInventoryItemId}
                                    onChange={(event) =>
                                        setStockInInventoryItemId(event.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">
                                        Select Inventory Item
                                    </option>

                                    {inventoryItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={stockInQuantity}
                                    onChange={(event) =>
                                        setStockInQuantity(event.target.value)
                                    }
                                    required
                                    placeholder="Enter quantity"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Notes
                                </label>

                                <textarea
                                    value={stockInNotes}
                                    onChange={(event) =>
                                        setStockInNotes(event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Optional notes..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowStockInModal(false)}
                                disabled={stockInLoading}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={stockInLoading}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {stockInLoading ? 'Processing...' : 'Stock In'}
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