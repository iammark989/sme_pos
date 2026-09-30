import { useEffect, useState } from 'react';

export default function ReportsIndex() {
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState('');
    const [date, setDate] = useState(
        new Date().toISOString().split('T')[0]
    );

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

            if (!response.ok) {
                throw new Error('Failed to load branches.');
            }

            const result = await response.json();

            setBranches(result.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingBranches(false);
        }
    };

    const loadDailyReport = async () => {
        try {
            setLoadingReport(true);
            setError('');

            const params = new URLSearchParams({
                date,
            });

            if (branchId) {
                params.append('branch_id', branchId);
            }

            const response = await fetch(
                `/api/reports/sales/daily?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load sales report.');
            }

            const result = await response.json();

            setReport(result.data);
        } catch (err) {
            setError(err.message);
            setReport(null);
        } finally {
            setLoadingReport(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Sales Reports
                    </h1>

                    <p className="mt-1 text-gray-600">
                        View sales performance by date and branch.
                    </p>
                </div>

                {/** Transaction History */}
                <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                    <a
                    href="/reports/transactions"
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Transaction History
                </a>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Date
                            </label>

                            <input
                                type="date"
                                value={date}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Branch
                            </label>

                            <select
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

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={loadDailyReport}
                                disabled={loadingReport || !date}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loadingReport
                                    ? 'Loading...'
                                    : 'Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* Report */}
                {report && (
                    <>
                        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <SummaryCard
                                title="Transactions"
                                value={report.summary.transaction_count}
                            />

                            <SummaryCard
                                title="Gross Sales"
                                value={`₱${Number(
                                    report.summary.gross_sales
                                ).toFixed(2)}`}
                            />

                            <SummaryCard
                                title="Discounts"
                                value={`₱${Number(
                                    report.summary.discounts
                                ).toFixed(2)}`}
                            />

                            <SummaryCard
                                title="Net Sales"
                                value={`₱${Number(
                                    report.summary.net_sales
                                ).toFixed(2)}`}
                            />

                            <SummaryCard
                                title="Cash Sales"
                                value={`₱${Number(
                                    report.summary.cash_sales
                                ).toFixed(2)}`}
                            />
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                Payment Summary
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <SummaryCard
                                    title="Cash Sales"
                                    value={`₱${Number(
                                        report.summary.cash_sales
                                    ).toFixed(2)}`}
                                />

                                <SummaryCard
                                    title="GCash Sales"
                                    value={`₱${Number(
                                        report.summary.gcash_sales
                                    ).toFixed(2)}`}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
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