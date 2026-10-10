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

    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        loadBranches();
    }, []);

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


    const handleReset = () => {

        setDateFrom(today);

        setDateTo(today);

        setBranchId('');
        setProductDate(today);
        setProductReport(null);
        setProductError('');

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
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sales reports">
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
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                                <div className="mb-4 flex flex-col gap-2 rounded-lg bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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