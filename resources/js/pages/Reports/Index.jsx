import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';

export default function ReportsIndex() {
    const today = new Date().toISOString().split('T')[0];

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState('');

    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    const [report, setReport] = useState(null);

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

    const handleReset = () => {
        setDateFrom(today);
        setDateTo(today);
        setBranchId('');
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
                                    onChange={(event) =>
                                        setBranchId(event.target.value)
                                    }
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
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadingReport
                                        ? 'Loading...'
                                        : 'Generate Report'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={loadingReport}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                        </>
                    )}

                    {/* Empty State */}
                    {!report && !loadingReport && !error && (
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