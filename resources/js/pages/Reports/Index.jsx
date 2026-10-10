import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';

export default function ReportsIndex() {
    const today = new Date().toISOString().split('T')[0];
    const [activeTab, setActiveTab] = useState('range');
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState('');

    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    const [report, setReport] = useState(null);
    const [productDate, setProductDate] = useState(today);
    const [productReport, setProductReport] = useState(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productError, setProductError] = useState('');

    const [inventoryView, setInventoryView] = useState('stocks');
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryWarehouseId, setInventoryWarehouseId] = useState('');
    const [inventoryDateFrom, setInventoryDateFrom] = useState(today);
    const [inventoryDateTo, setInventoryDateTo] = useState(today);
    const [inventoryResult, setInventoryResult] = useState(null);
    const [inventoryPage, setInventoryPage] = useState(1);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [inventoryError, setInventoryError] = useState('');

    const [warehouses, setWarehouses] = useState([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);

    const [inventorySummary, setInventorySummary] = useState(null);

    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        loadBranches();
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const response = await fetch('/api/warehouses', {
                headers: {
                    Accept: 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load warehouses.'
                );
            }

            const warehouseData = result.data?.data ?? result.data ?? [];

            setWarehouses(
                Array.isArray(warehouseData) ? warehouseData : []
            );
        } catch (err) {
            console.error('Failed to load warehouses:', err);
            setWarehouses([]);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            setError('');

            const response = await fetch('/api/branches', {
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
        } catch (err) {
            setError(err.message || 'Failed to load branches.');
        } finally {
            setLoadingBranches(false);
        }
    };

    const loadReport = async () => {
        try {
            setLoadingReport(true);
            setError('');

            if (!dateFrom || !dateTo) {
                throw new Error(
                    'Please select both start and end dates.'
                );
            }

            if (dateFrom > dateTo) {
                throw new Error(
                    'The start date cannot be later than the end date.'
                );
            }

            const params = new URLSearchParams({
                date_from: dateFrom,
                date_to: dateTo,
            });

            if (branchId) {
                params.append('branch_id', branchId);
            }

            const response = await fetch(
                `/api/reports/sales?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                        'Failed to load sales report.'
                );
            }

            setReport(result.data);
        } catch (err) {
            setError(
                err.message || 'Failed to load sales report.'
            );

            setReport(null);

        } finally {
            setLoadingReport(false);
        }
    };

    const loadProductReport = async () => {
        try {
            setLoadingProducts(true);
            setProductError('');

            if (!productDate) {
                throw new Error('Please select a date for the product sales report.');
            }

            const params = new URLSearchParams({ date: productDate });

            if (branchId) {
                params.append('branch_id', branchId);
            }

            const response = await fetch(
                `/api/reports/sales/daily/products?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load daily product sales report.'
                );
            }

            setProductReport(result.data);

        } catch (err) {
            setProductError(
                err.message || 'Failed to load daily product sales report.'
            );
            setProductReport(null);
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadInventoryReport = async (page = 1, view = inventoryView) => {
        try {
            setLoadingInventory(true);
            setInventoryError('');
            
            if (
                view === 'movement' &&
                inventoryDateFrom &&
                inventoryDateTo &&
                inventoryDateFrom > inventoryDateTo
            ) {
                setInventoryResult(null);
                setInventoryPage(1);
                setInventoryError(
                    'The start date cannot be later than the end date.'
                );
                return;
            }

            const params = new URLSearchParams({
                page: String(page),
                per_page: '20',
            });

            if (inventorySearch.trim()) {
                params.append('search', inventorySearch.trim());
            }

            if (inventoryWarehouseId.trim()) {
                params.append('warehouse_id', inventoryWarehouseId.trim());
            }

            let endpoint = '/api/inventory/stocks';

            if (view === 'low-stock') {
                params.append('low_stock', '1');
            } else if (view === 'movement') {
                endpoint = '/api/inventory/transactions';
                if (inventoryDateFrom) params.append('date_from', inventoryDateFrom);
                if (inventoryDateTo) params.append('date_to', inventoryDateTo);
            }

            const response = await fetch(`${endpoint}?${params.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load inventory report.');
            }

            // Both endpoints return { data: paginator }.
            setInventorySummary(result.summary ?? null);
            setInventoryResult(result.data ?? null);
            setInventoryPage(page);
        } catch (err) {
            setInventoryError(err.message || 'Failed to load inventory report.');
            setInventoryResult(null);
        } finally {
            setLoadingInventory(false);
        }
    };

    const handleInventoryViewChange = (view) => {
        setInventoryView(view);
        setInventoryResult(null);
        setInventoryError('');
        setInventoryPage(1);
    };

    const handleReset = () => {

        setDateFrom(today);
        setDateTo(today);
        setBranchId('');
        setProductDate(today);
        setProductReport(null);
        setProductError('');
        setInventorySearch('');
        setInventoryWarehouseId('');
        setInventoryDateFrom(today);
        setInventoryDateTo(today);
        setInventoryResult(null);
        setInventoryError('');
        setInventoryPage(1);
        setInventorySummary(null);
        setReport(null);
        setError('');

    };

    const formatCurrency = (value) => {
        return `₱${Number(value ?? 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getBranchName = () => {
        if (!branchId) {
            return 'All Branches';
        }

        const branch = branches.find(
            (item) => String(item.id) === String(branchId)
        );

        return branch
            ? `${branch.name} (${branch.code})`
            : 'Selected Branch';
    };

    function downloadCsv(filename, headers, rows) {
        const escapeCsvValue = (value) => {
            let text = String(value ?? '');

            // Prevent spreadsheet formula injection.
            if (/^[\t\r ]*[=+\-@]/.test(text)) {
                text = `'${text}`;
            }

            return `"${text.replace(/"/g, '""')}"`;
        };

        const csvContent = [
            headers.map(escapeCsvValue).join(','),
            ...rows.map((row) => row.map(escapeCsvValue).join(',')),
        ].join('\r\n');

        // UTF-8 BOM helps Excel display the CSV correctly.
        const blob = new Blob(['\uFEFF', csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    const exportSalesRangeCsv = () => {
        if (!report) {
            return;
        }

        const rows = (report.daily_sales ?? []).map((day) => [
            day.date,
            Number(day.transaction_count ?? 0),
            Number(day.gross_sales ?? 0).toFixed(2),
            Number(day.discounts ?? 0).toFixed(2),
            Number(day.net_sales ?? 0).toFixed(2),
        ]);

        downloadCsv(
            `sales-report-${dateFrom}-to-${dateTo}.csv`,
            [
                'Date',
                'Transactions',
                'Gross Sales',
                'Discounts',
                'Net Sales',
            ],
            rows
        );
    };

    const exportProductSalesCsv = () => {
        if (!productReport) {
            return;
        }

        const rows = (productReport.products ?? []).map((product) => [
            product.sku ?? '',
            product.product_name ?? '',
            Number(product.quantity_sold ?? 0),
            Number(product.gross_sales ?? 0).toFixed(2),
        ]);

        downloadCsv(
            `daily-product-sales-${productReport.date || productDate}.csv`,
            ['SKU', 'Product Name', 'Quantity Sold', 'Gross Sales'],
            rows
        );
    };

    
    const exportInventoryStocksCsv = async () => {
        if (inventoryView === 'movement') {
            return;
        }

        try {
            setLoadingInventory(true);
            setInventoryError('');

            const allRows = [];
            let page = 1;
            let lastPage = 1;

            do {
                const params = new URLSearchParams({
                    page: String(page),
                    per_page: '100',
                });

                if (inventorySearch.trim()) {
                    params.append('search', inventorySearch.trim());
                }

                if (inventoryWarehouseId.trim()) {
                    params.append('warehouse_id', inventoryWarehouseId.trim());
                }

                if (inventoryView === 'low-stock') {
                    params.append('low_stock', '1');
                }

                const response = await fetch(
                    `/api/inventory/stocks?${params.toString()}`,
                    {
                        headers: { Accept: 'application/json' },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Failed to export inventory report.'
                    );
                }

                const paginator = result.data;
                const pageRows = Array.isArray(paginator?.data)
                    ? paginator.data
                    : [];

                allRows.push(...pageRows);
                lastPage = Number(paginator?.last_page ?? 1);
                page += 1;
            } while (page <= lastPage);

            const rows = allRows.map((row) => {
                const item = row.inventory_item ?? row.inventoryItem ?? {};
                const warehouse = row.warehouse ?? {};
                const uom = item.uom ?? {};
                const quantity = Number(row.quantity ?? 0);
                const reorderLevel = Number(item.reorder_level ?? 0);
                const isLow = row.is_low_stock ?? (quantity <= reorderLevel);

                return [
                    item.sku ?? '',
                    item.name ?? '',
                    warehouse.name ?? '',
                    warehouse.branch?.name ?? '',
                    quantity,
                    uom.abbreviation ?? uom.symbol ?? uom.name ?? '',
                    reorderLevel,
                    isLow ? 'Low Stock' : 'In Stock',
                ];
            });

            const filename = inventoryView === 'low-stock'
                ? 'inventory-low-stock.csv'
                : 'inventory-stock-on-hand.csv';

            downloadCsv(
                filename,
                [
                    'SKU',
                    'Item',
                    'Warehouse',
                    'Branch',
                    'Quantity',
                    'UOM',
                    'Reorder Level',
                    'Status',
                ],
                rows
            );
        } catch (err) {
            setInventoryError(
                err.message || 'Failed to export inventory report.'
            );
        } finally {
            setLoadingInventory(false);
        }
    };

    
    const exportInventoryMovementCsv = async () => {
        try {
            if (
                inventoryDateFrom &&
                inventoryDateTo &&
                inventoryDateFrom > inventoryDateTo
            ) {
                setInventoryError(
                    'The start date cannot be later than the end date.'
                );
                return;
            }

            setLoadingInventory(true);
            setInventoryError('');

            const allRows = [];
            let page = 1;
            let lastPage = 1;

            do {
                const params = new URLSearchParams({
                    page: String(page),
                    per_page: '100',
                });

                if (inventorySearch.trim()) {
                    params.append('search', inventorySearch.trim());
                }

                if (inventoryWarehouseId.trim()) {
                    params.append('warehouse_id', inventoryWarehouseId.trim());
                }

                if (inventoryDateFrom) {
                    params.append('date_from', inventoryDateFrom);
                }

                if (inventoryDateTo) {
                    params.append('date_to', inventoryDateTo);
                }

                const response = await fetch(
                    `/api/inventory/transactions?${params.toString()}`,
                    {
                        headers: { Accept: 'application/json' },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Failed to export inventory movement.'
                    );
                }

                const paginator = result.data;
                const pageRows = Array.isArray(paginator?.data)
                    ? paginator.data
                    : [];

                allRows.push(...pageRows);
                lastPage = Number(paginator?.last_page ?? 1);
                page += 1;
            } while (page <= lastPage);

            const rows = allRows.map((row) => {
                const item = row.inventory_item ?? row.inventoryItem ?? {};
                const warehouse = row.warehouse ?? {};

                const reference = [
                    row.transfer_reference,
                    row.reference_type && row.reference_id
                        ? `${row.reference_type} #${row.reference_id}`
                        : null,
                    row.notes,
                ]
                    .filter(Boolean)
                    .join(' · ');

                return [
                    row.created_at
                        ? new Date(row.created_at).toLocaleString('en-PH')
                        : '',
                    item.sku ?? '',
                    item.name ?? '',
                    row.transaction_category ?? 'Other',
                    row.type ?? '',
                    Number(row.quantity ?? 0),
                    warehouse.name ?? '',
                    row.related_warehouse?.name ?? '',
                    reference,
                ];
            });

            const from = inventoryDateFrom || 'all-dates';
            const to = inventoryDateTo || 'all-dates';

            downloadCsv(
                `inventory-movement-${from}-to-${to}.csv`,
                [
                    'Date',
                    'SKU',
                    'Item',
                    'Category',
                    'Type',
                    'Quantity',
                    'Warehouse',
                    'Related Warehouse',
                    'Reference / Notes',
                ],
                rows
            );
        } catch (err) {
            setInventoryError(
                err.message || 'Failed to export inventory movement.'
            );
        } finally {
            setLoadingInventory(false);
        }
    };



    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="mx-auto max-w-7xl">

                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Sales Reports
                            </h1>

                            <p className="mt-1 text-gray-600">
                                View sales performance by branch and
                                reporting period.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <a
                                href="/reports/transactions"
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Transaction History
                            </a>

                            <a
                                href="/shifts"
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Shifts History
                            </a>
                        </div>
                    </div>

                    {/* Report Tabs */}
                    <div className="mb-6 rounded-xl bg-white p-2 shadow-sm">
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Reports">
                            <button
                                type="button"
                                role="tab"
                                id="sales-range-tab"
                                aria-selected={activeTab === 'range'}
                                aria-controls="sales-range-panel"
                                onClick={() => setActiveTab('range')}
                                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                                    activeTab === 'range'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                                }`}
                            >
                                Sales by Date Range
                            </button>

                            <button

                                type="button"

                                role="tab"

                                id="daily-products-tab"

                                aria-selected={activeTab === 'products'}

                                aria-controls="daily-products-panel"

                                onClick={() => setActiveTab('products')}

                                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${

                                    activeTab === 'products'

                                        ? 'bg-blue-600 text-white shadow-sm'

                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'

                                }`}

                            >

                                Daily Product Sales

                            </button>                            <button
                                type="button"
                                role="tab"
                                id="inventory-reports-tab"
                                aria-selected={activeTab === 'inventory'}
                                aria-controls="inventory-reports-panel"
                                onClick={() => setActiveTab('inventory')}
                                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                                    activeTab === 'inventory'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                                }`}
                            >
                                Inventory Reports
                            </button>


                        </div>

                    </div>



                    {activeTab === 'range' && (

                        <div id="sales-range-panel" role="tabpanel" aria-labelledby="sales-range-tab">

                            <>

                    {/* Report Filters */}

                    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                        <div className="mb-5">

                            <h2 className="text-lg font-semibold text-gray-900">

                                Sales by Date Range

                            </h2>



                            <p className="mt-1 text-sm text-gray-500">

                                Analyze sales performance across a

                                selected period.

                            </p>

                        </div>



                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">



                            {/* Date From */}

                            <div>

                                <label

                                    htmlFor="date_from"

                                    className="mb-2 block text-sm font-medium text-gray-700"

                                >

                                    Date From

                                </label>



                                <input

                                    id="date_from"

                                    type="date"

                                    value={dateFrom}

                                    onChange={(event) =>

                                        setDateFrom(event.target.value)

                                    }

                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"

                                />

                            </div>



                            {/* Date To */}

                            <div>

                                <label

                                    htmlFor="date_to"

                                    className="mb-2 block text-sm font-medium text-gray-700"

                                >

                                    Date To

                                </label>



                                <input

                                    id="date_to"

                                    type="date"

                                    value={dateTo}

                                    onChange={(event) =>

                                        setDateTo(event.target.value)

                                    }

                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"

                                />

                            </div>



                            {/* Branch */}

                            <div>

                                <label

                                    htmlFor="branch_id"

                                    className="mb-2 block text-sm font-medium text-gray-700"

                                >

                                    Branch

                                </label>



                                <select

                                    id="branch_id"

                                    value={branchId}

                                    onChange={(event) => {

                                        setBranchId(event.target.value);

                                        setProductReport(null);

                                        setProductError('');

                                    }}

                                    disabled={loadingBranches}

                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"

                                >

                                    <option value="">

                                        All Branches

                                    </option>



                                    {branches.map((branch) => (

                                        <option

                                            key={branch.id}

                                            value={branch.id}

                                        >

                                            {branch.name} ({branch.code})

                                        </option>

                                    ))}

                                </select>

                            </div>



                            {/* Actions */}

                            <div className="flex items-end gap-2">

                                <button

                                    type="button"

                                    onClick={loadReport}

                                    disabled={

                                        loadingReport ||

                                        !dateFrom ||

                                        !dateTo

                                    }

                                    className="cursor-pointer flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

                                >

                                    {loadingReport

                                        ? 'Loading...'

                                        : 'Generate Report'}

                                </button>



                                <button

                                    type="button"

                                    onClick={handleReset}

                                    disabled={loadingReport}

                                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"

                                >

                                    Reset

                                </button>

                            </div>

                        </div>

                    </div>



                    {/* Error */}

                    {error && (

                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                            {error}

                        </div>

                    )}



                    {/* Report Results */}

                    {report && (
                        <>
                            {/* Report Context */}
                            <div className="mb-6 rounded-xl bg-white px-6 py-4 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Reporting Period
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {dateFrom} — {dateTo}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Branch
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {getBranchName()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={exportSalesRangeCsv}
                                        disabled={!report}
                                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Export CSV
                                    </button>
                                </div>

                            </div>

                            {/* Summary */}
                            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <SummaryCard
                                    title="Transactions"
                                    value={
                                        report.summary
                                            ?.transaction_count ?? 0
                                    }
                                />

                                <SummaryCard
                                    title="Gross Sales"
                                    value={formatCurrency(
                                        report.summary?.gross_sales
                                    )}
                                />

                                <SummaryCard
                                    title="Discounts"
                                    value={formatCurrency(
                                        report.summary?.discounts
                                    )}
                                />

                                <SummaryCard
                                    title="Net Sales"
                                    value={formatCurrency(
                                        report.summary?.net_sales
                                    )}
                                />

                            </div>



                            {/* Payment Summary */}
                            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                                <div className="mb-5">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Payment Summary
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Sales grouped by payment method.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">

                                    <SummaryCard
                                        title="Cash Sales"
                                        value={formatCurrency(
                                            report.summary?.cash_sales
                                        )}
                                    />

                                    <SummaryCard
                                        title="GCash Sales"
                                        value={formatCurrency(
                                            report.summary?.gcash_sales
                                        )}
                                    />

                                </div>
                            </div>



                             {/* Voided Transactions Summary */}

                            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                                <div className="mb-5">

                                    <h2 className="text-lg font-semibold text-gray-900">

                                        Voided Transactions

                                    </h2>



                                    <p className="mt-1 text-sm text-gray-500">

                                        Transactions voided during the selected reporting period.

                                    </p>

                                </div>



                                <div className="grid gap-4 sm:grid-cols-2">



                                    <SummaryCard

                                        title="Voided Transactions"

                                        value={Number(report.summary?.voided_transaction_count ?? 0).toLocaleString('en-PH')}

                                    />



                                    <SummaryCard

                                        title="Voided Sales Value"

                                        value={formatCurrency(report.summary?.voided_sales)}

                                    />

                                </div>

                            </div>







                            {/* Daily Sales Breakdown */}

                            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                                <div className="mb-5">

                                    <h2 className="text-lg font-semibold text-gray-900">

                                        Daily Sales Breakdown

                                    </h2>



                                    <p className="mt-1 text-sm text-gray-500">

                                        Sales totals for each day in the selected reporting period.

                                    </p>

                                </div>



                                {Array.isArray(report.daily_sales) && report.daily_sales.length > 0 ? (

                                    <div className="overflow-x-auto">

                                        <table className="min-w-full divide-y divide-gray-200">

                                            <thead className="bg-gray-50">

                                                <tr>

                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Transactions</th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Gross Sales</th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Discounts</th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Net Sales</th>

                                                </tr>

                                            </thead>



                                            <tbody className="divide-y divide-gray-200 bg-white">

                                                {report.daily_sales.map((day) => (

                                                    <tr key={day.date}>

                                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{day.date}</td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{Number(day.transaction_count ?? 0).toLocaleString('en-PH')}</td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(day.gross_sales)}</td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(day.discounts)}</td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(day.net_sales)}</td>

                                                    </tr>

                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                ) : (

                                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">

                                        No daily sales found for the selected reporting period.

                                    </p>

                                )}

                            </div>

                        </>

                    )}



                            </>

                        </div>

                    )}



                    {activeTab === 'products' && (

                        <div id="daily-products-panel" role="tabpanel" aria-labelledby="daily-products-tab">

                    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                        <div className="mb-5">

                            <h2 className="text-lg font-semibold text-gray-900">

                                Daily Product Sales Report

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                See the products sold, quantities, and gross sales for a selected date and branch.

                            </p>

                        </div>



                        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                            <div>

                                <label

                                    htmlFor="product_report_date"

                                    className="mb-2 block text-sm font-medium text-gray-700"

                                >

                                    Sales Date

                                </label>

                                <input

                                    id="product_report_date"

                                    type="date"

                                    value={productDate}

                                    onChange={(event) => {

                                        setProductDate(event.target.value);

                                        setProductReport(null);

                                        setProductError('');

                                    }}

                                    max={today}

                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"

                                />

                            </div>



                            <div className="flex items-end">

                                <button

                                    type="button"

                                    onClick={loadProductReport}

                                    disabled={loadingProducts || !productDate || loadingBranches}

                                    className="cursor-pointer w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

                                >

                                    {loadingProducts ? 'Loading...' : 'Generate Product Report'}

                                </button>

                            </div>

                        </div>



                        {productError && (

                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                                {productError}

                            </div>

                        )}



                        {productReport && (
                            <>
                                <div className="mb-4 flex flex-col gap-4 rounded-lg bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Sales Date
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {productReport.date}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Branch
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {getBranchName()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={exportProductSalesCsv}
                                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Export CSV
                                    </button>
                                </div>

                                <div className="mb-4 grid gap-4 sm:grid-cols-2">

                                    <SummaryCard
                                        title="Products Sold"
                                        value={Number(productReport.products?.length ?? 0).toLocaleString('en-PH')}
                                    />

                                    <SummaryCard
                                        title="Total Product Gross Sales"
                                        value={formatCurrency(
                                            (productReport.products ?? []).reduce(
                                                (total, product) => total + Number(product.gross_sales ?? 0),
                                                0
                                            )
                                        )}
                                    />

                                </div>

                                {Array.isArray(productReport.products) && productReport.products.length > 0 ? (

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        SKU
                                                    </th>

                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Product Name
                                                    </th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Quantity Sold
                                                    </th>

                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Gross Sales
                                                    </th>
                                                </tr>

                                            </thead>

                                            <tbody className="divide-y divide-gray-200 bg-white">

                                                {productReport.products.map((product) => (
                                                    <tr key={product.product_id}>
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                            {product.sku || '—'}
                                                        </td>

                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {product.product_name}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                            {Number(product.quantity_sold ?? 0).toLocaleString('en-PH')}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                            {formatCurrency(product.gross_sales)}
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>

                                            <tfoot className="bg-gray-50">

                                                <tr>
                                                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                        Total
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                        {productReport.products.reduce(
                                                            (total, product) => total + Number(product.quantity_sold ?? 0),
                                                            0
                                                        ).toLocaleString('en-PH')}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">

                                                        {formatCurrency(
                                                            productReport.products.reduce(
                                                                (total, product) => total + Number(product.gross_sales ?? 0),
                                                                0
                                                            )
                                                        )}
                                                    </td>

                                                </tr>
                                            </tfoot>
                                        </table>

                                    </div>

                                ) : (

                                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                                        No completed product sales found for the selected date and branch.
                                    </p>
                                )}
                            </>
                        )}

                        {!productReport && !loadingProducts && !productError && (

                            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">

                                Select a sales date and generate the product report.

                            </p>

                        )}

                    </div>



                        </div>

                    )}



                    {activeTab === 'inventory' && (
                        <div id="inventory-reports-panel" role="tabpanel" aria-labelledby="inventory-reports-tab">
                            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                                <div className="mb-5">
                                    <h2 className="text-lg font-semibold text-gray-900">Inventory Reports</h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Review current stock levels and inventory transactions using existing inventory endpoints.
                                    </p>
                                </div>

                                <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Inventory report type">
                                    {[
                                        { id: 'stocks', label: 'Stock on Hand' },
                                        { id: 'low-stock', label: 'Low Stock' },
                                        { id: 'movement', label: 'Inventory Movement' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={inventoryView === item.id}
                                            onClick={() => handleInventoryViewChange(item.id)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                                inventoryView === item.id
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label htmlFor="inventory_search" className="mb-2 block text-sm font-medium text-gray-700">Search item</label>
                                        <input
                                            id="inventory_search"
                                            type="text"
                                            value={inventorySearch}
                                            onChange={(event) => {
                                                    setInventorySearch(event.target.value);
                                                    setInventoryPage(1);
                                                    setInventoryResult(null);
                                                }}
                                            placeholder="Product name or SKU"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="inventory_warehouse_id"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Warehouse (optional)
                                        </label>

                                        <select
                                            id="inventory_warehouse_id"
                                            value={inventoryWarehouseId}
                                            onChange={(event) => {
                                                setInventoryWarehouseId(event.target.value);
                                                setInventoryPage(1);
                                                setInventoryResult(null);
                                            }}
                                            disabled={loadingWarehouses}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                                        >
                                            <option value="">
                                                All accessible warehouses
                                            </option>

                                            {warehouses.map((warehouse) => (
                                                <option
                                                    key={warehouse.id}
                                                    value={warehouse.id}
                                                >
                                                    {warehouse.name}
                                                    {warehouse.branch?.name
                                                        ? ` — ${warehouse.branch.name}`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {inventoryView === 'movement' && (
                                        <>
                                            <div>
                                                <label htmlFor="inventory_date_from" className="mb-2 block text-sm font-medium text-gray-700">Date From</label>
                                                <input id="inventory_date_from" type="date" value={inventoryDateFrom} onChange={(event) => {setInventoryDateFrom(event.target.value);setInventoryPage(1);setInventoryResult(null);}} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label htmlFor="inventory_date_to" className="mb-2 block text-sm font-medium text-gray-700">Date To</label>
                                                <input id="inventory_date_to" type="date" value={inventoryDateTo} onChange={(event) => {setInventoryDateTo(event.target.value);setInventoryPage(1);setInventoryResult(null);}} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mb-5 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => loadInventoryReport(1)} disabled={loadingInventory} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                        {loadingInventory ? 'Loading...' : 'Generate Report'}
                                    </button>
                                    <button type="button" onClick={() => {
                                        setInventorySearch('');
                                        setInventoryWarehouseId('');
                                        setInventoryDateFrom(today);
                                        setInventoryDateTo(today);
                                        setInventoryResult(null);
                                        setInventoryError('');
                                        setInventoryPage(1);
                                    }} disabled={loadingInventory} className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                                        Reset Filters
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (inventoryView === 'movement') {
                                                exportInventoryMovementCsv();
                                            } else {
                                                exportInventoryStocksCsv();
                                            }
                                        }}
                                        disabled={loadingInventory}
                                        className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Export CSV
                                    </button>
                                </div>

                                {inventoryError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{inventoryError}</div>}

                                {inventoryResult && (() => {
                                    const rows = Array.isArray(inventoryResult.data) ? inventoryResult.data : [];
                                    const moneyOrQuantity = (value) => Number(value ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 3 });
                                    return (
                                        <>
                                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-sm text-gray-600">
                                                    Showing {inventoryResult.from ?? (rows.length ? 1 : 0)}–{inventoryResult.to ?? rows.length} of {inventoryResult.total ?? rows.length} records
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {inventoryView === 'stocks' ? 'Stock on Hand' : inventoryView === 'low-stock' ? 'Low Stock Items' : 'Inventory Movement'}
                                                </p>
                                            </div>

                            {/* Inventory Movement Summary */}
                            {inventoryView === 'movements' && inventorySummary && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
                                    {[
                                        {
                                            label: 'Stock In',
                                            count: inventorySummary.stock_in_count,
                                            quantity: inventorySummary.stock_in_quantity,
                                        },
                                        {
                                            label: 'Sale',
                                            count: inventorySummary.sale_count,
                                            quantity: inventorySummary.sale_quantity,
                                        },
                                        {
                                            label: 'Sale Reversal',
                                            count: inventorySummary.sale_reversal_count,
                                            quantity: inventorySummary.sale_reversal_quantity,
                                        },
                                        {
                                            label: 'Adjustment',
                                            count: inventorySummary.adjustment_count,
                                            quantity: inventorySummary.adjustment_quantity,
                                        },
                                        {
                                            label: 'Transfer In',
                                            count: inventorySummary.transfer_in_count,
                                            quantity: inventorySummary.transfer_in_quantity,
                                        },
                                        {
                                            label: 'Transfer Out',
                                            count: inventorySummary.transfer_out_count,
                                            quantity: inventorySummary.transfer_out_quantity,
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                                        >
                                            <h3 className="text-sm font-medium text-gray-500">
                                                {item.label}
                                            </h3>

                                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                                                {Number(item.count ?? 0).toLocaleString()}
                                                <span className="ml-2 text-sm font-normal text-gray-500">
                                                    transactions
                                                </span>
                                            </p>

                                            <p className="mt-1 text-sm text-gray-600">
                                                Quantity:{' '}
                                                {Number(item.quantity ?? 0).toLocaleString(undefined, {
                                                    maximumFractionDigits: 3,
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        {inventoryView === 'movement' ? (
                                                            <tr>
                                                                {['Date', 'SKU', 'Item', 'Category', 'Type', 'Quantity', 'Warehouse', 'Related Warehouse', 'Reference / Notes'].map((label) => <th key={label} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}
                                                            </tr>
                                                        ) : (
                                                            <tr>
                                                                {['SKU', 'Item', 'Warehouse', 'Branch', 'Quantity', 'UOM', 'Reorder Level', 'Status'].map((label) => <th key={label} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}
                                                            </tr>
                                                        )}
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                        {rows.map((row) => {
                                                            const item = row.inventory_item ?? row.inventoryItem ?? {};
                                                            const warehouse = row.warehouse ?? {};
                                                            if (inventoryView === 'movement') {
                                                                return (
                                                                    <tr key={row.id}>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{row.created_at ? new Date(row.created_at).toLocaleString('en-PH') : '—'}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.sku || '—'}</td>
                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name || '—'}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{row.transaction_category || 'Other'}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{row.type || '—'}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{moneyOrQuantity(row.quantity)}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{warehouse.name || '—'}</td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{row.related_warehouse?.name || '—'}</td>
                                                                        <td className="min-w-48 px-4 py-3 text-sm text-gray-700">{[row.transfer_reference, row.reference_type && row.reference_id ? `${row.reference_type} #${row.reference_id}` : null, row.notes].filter(Boolean).join(' · ') || '—'}</td>
                                                                    </tr>
                                                                );
                                                            }
                                                            const uom = item.uom ?? {};
                                                            const quantity = Number(row.quantity ?? 0);
                                                            const reorderLevel = Number(item.reorder_level ?? 0);
                                                            const isLow = row.is_low_stock ?? (quantity <= reorderLevel);
                                                            return (
                                                                <tr key={row.id}>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.sku || '—'}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name || '—'}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{warehouse.name || '—'}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{warehouse.branch?.name || '—'}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{moneyOrQuantity(row.quantity)}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{uom.abbreviation || uom.symbol || uom.name || '—'}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{moneyOrQuantity(item.reorder_level)}</td>
                                                                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                                        {isLow ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Low Stock</span> : <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">In Stock</span>}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {rows.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No records found for the selected filters.</p>}
                                            <div className="mt-5 flex items-center justify-between gap-3">
                                                <button type="button" onClick={() => loadInventoryReport(Math.max(1, inventoryPage - 1))} disabled={loadingInventory || inventoryPage <= 1} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                                                <span className="text-sm text-gray-600">Page {inventoryResult.current_page ?? inventoryPage} of {inventoryResult.last_page ?? 1}</span>
                                                <button type="button" onClick={() => loadInventoryReport(inventoryPage + 1)} disabled={loadingInventory || inventoryPage >= (inventoryResult.last_page ?? 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                                            </div>
                                        </>
                                    );
                                })()}

                                {!inventoryResult && !loadingInventory && !inventoryError && (
                                    <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Choose a report type, set any filters, and generate the inventory report.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}

                    {activeTab === 'range' && !report && !loadingReport && !error && (

                        <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">

                            <h2 className="text-lg font-semibold text-gray-900">

                                No Report Generated

                            </h2>



                            <p className="mt-1 text-sm text-gray-500">

                                Select a date range and branch, then

                                generate a sales report.

                            </p>

                        </div>

                    )}

                </div>

            </div>

        </AuthenticatedLayout>

    );

}



function SummaryCard({ title, value }) {

    return (

        <div className="rounded-xl bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">

                {title}

            </p>



            <p className="mt-2 text-2xl font-bold text-gray-900">

                {value}

            </p>

        </div>

    );

}