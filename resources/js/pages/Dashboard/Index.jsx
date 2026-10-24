import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth.user;

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [businessDay, setBusinessDay] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [confirmedClose, setConfirmedClose] = useState(false);
    const [recoveryReason, setRecoveryReason] = useState('');
    const [closeLoading, setCloseLoading] = useState(false);
    const [closeError, setCloseError] = useState(null);
    const [savedZReading, setSavedZReading] = useState(null);

    useEffect(() => {
        axios
            .get('/api/business-days/current')
            .then((response) => {
                setBusinessDay(response.data.business_day);
            })
            .catch((error) => {
                console.error('Failed to load current business day:', error);
            });
    }, []);

    useEffect(() => {
        axios
            .get('/api/dashboard')
            .then((response) => {
                setDashboard(response.data.data);
            })
            .catch((error) => {
                console.error(error);

                setError(
                    error.response?.data?.message ||
                        'Failed to load dashboard data.'
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount ?? 0);
    };

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleString('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    const getStatusClass = (status) => {
        if (status === 'completed') {
            return 'bg-green-100 text-green-700';
        }

        if (status === 'voided') {
            return 'bg-red-100 text-red-700';
        }

        return 'bg-gray-100 text-gray-700';
    };

    const cards = dashboard
        ? [
              {
                  label: "Today's Sales",
                  value: formatCurrency(dashboard.today_sales),
              },
              {
                  label: 'Transactions',
                  value: dashboard.transaction_count,
              },
              {
                  label: 'Cash Sales',
                  value: formatCurrency(dashboard.cash_sales),
              },
              {
                  label: 'GCash Sales',
                  value: formatCurrency(dashboard.gcash_sales),
              },
              {
                  label: 'Voided Transactions',
                  value: dashboard.voided_transactions,
              },
              {
                  label: 'Low Stock',
                  value: dashboard.low_stock_items,
              },
              {
                  label: 'Open Shifts',
                  value: dashboard.open_shifts,
              },
          ]
        : [];

        const isStaff = user.role?.name === 'Staff';

        const openShifts = Number(dashboard?.open_shifts ?? 0);

        const businessDate = businessDay?.business_date
            ? String(businessDay.business_date).slice(0, 10)
            : null;

        const today = (() => {
            const date = new Date();

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        })();

        const isRecoveryClose = Boolean(
            businessDate && businessDate < today
        );

        const canCloseBusinessDay = Boolean(
            isStaff &&
            dashboard &&
            openShifts === 0 &&
            businessDay?.status === 'open'
        );

        const handleCloseBusinessDay = async () => {
            if (!canCloseBusinessDay || !confirmedClose || closeLoading) {
                return;
            }

            if (isRecoveryClose && !recoveryReason.trim()) {
                setCloseError('Please provide a reason for the late business-day close.');
                return;
            }

            setCloseLoading(true);
            setCloseError(null);

            try {
                const response = await axios.post(
                    '/api/business-days/z-reading/close',
                    {
                        recovery_reason: isRecoveryClose
                            ? recoveryReason.trim()
                            : null,
                    }
                );

                setSavedZReading(response.data.z_reading);
                setBusinessDay(null);
                setShowCloseModal(false);
                setConfirmedClose(false);
                setRecoveryReason('');

                // Refresh dashboard totals after closing.
                const dashboardResponse = await axios.get('/api/dashboard');

                setDashboard(dashboardResponse.data.data);
            } catch (error) {
                setCloseError(
                    error.response?.data?.message ||
                        'Failed to close the business day. Please try again.'
                );
            } finally {
                setCloseLoading(false);
            }
        };

    return (
        <AuthenticatedLayout>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>

                
                <div className="mt-6 flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    {/* Welcome Information */}
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Welcome, {user.first_name}!
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            You are logged in as{' '}
                            <span className="font-medium text-gray-800">
                                {user.role?.name}
                            </span>
                        </p>

                        {user.branch && (
                            <p className="mt-1 text-sm text-gray-500">
                                Branch: {user.branch.name}
                            </p>
                        )}
                    </div>

                    {/* Close Business Day */}
                    {canCloseBusinessDay && (
                        <div className="shrink-0 sm:ml-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setCloseError(null);
                                    setConfirmedClose(false);
                                    setRecoveryReason('');
                                    setShowCloseModal(true);
                                }}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                                    />
                                </svg>

                                Close POS / Branch
                            </button>
                        </div>
                    )}
                </div>

                {savedZReading && (
                    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                        <h2 className="font-semibold text-green-900">
                            Business day closed successfully
                        </h2>

                        <p className="mt-2 text-sm text-green-800">
                            Z-Reading: {savedZReading.reading_number}
                        </p>

                        <p className="mt-1 text-sm text-green-800">
                            Net sales: {formatCurrency(savedZReading.net_sales_amount)}
                        </p>

                        <p className="mt-1 text-sm text-green-800">
                            Generated: {formatDateTime(savedZReading.generated_at)}
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-gray-500">
                            Loading dashboard...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-6 rounded-xl bg-red-50 p-6 shadow-sm">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {!loading && !error && dashboard && (
                    <>
                        {/* Summary Cards */}
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {cards.map((card) => (
                                <div
                                    key={card.label}
                                    className="rounded-xl bg-white p-5 shadow-sm"
                                >
                                    <p className="text-sm font-medium text-gray-500">
                                        {card.label}
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {card.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Dashboard Details */}
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            {/* Low Stock */}
                            <div className="rounded-xl bg-white shadow-sm">
                                <div className="border-b border-gray-100 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Low Stock
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Items at or below their reorder level.
                                    </p>
                                </div>

                                {dashboard.low_stock?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left font-medium text-gray-500">
                                                        Item
                                                    </th>

                                                    <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                        Stock
                                                    </th>

                                                    <th className="px-6 py-3 text-right font-medium text-gray-500">
                                                        Reorder
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100">
                                                {dashboard.low_stock.map(
                                                    (item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-gray-900">
                                                                    {
                                                                        item.inventory_item
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-gray-500">
                                                                    {item.sku}
                                                                </p>

                                                                <p className="text-xs text-gray-500">
                                                                    {
                                                                        item.warehouse
                                                                    }
                                                                </p>
                                                            </td>

                                                            <td className="px-6 py-4 text-right font-semibold text-red-600">
                                                                {item.quantity}{' '}
                                                                {item.uom}
                                                            </td>

                                                            <td className="px-6 py-4 text-right text-gray-600">
                                                                {
                                                                    item.reorder_level
                                                                }{' '}
                                                                {item.uom}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                                        No low-stock items.
                                    </div>
                                )}
                            </div>

                            {/* Recent Transactions */}
                            <div className="rounded-xl bg-white shadow-sm">
                                <div className="border-b border-gray-100 px-6 py-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Recent Transactions
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Latest sales activity.
                                    </p>
                                </div>

                                {dashboard.recent_transactions?.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {dashboard.recent_transactions.map(
                                            (transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="flex items-center justify-between gap-4 px-6 py-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900">
                                                            {
                                                                transaction.sale_number
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {
                                                                transaction.cashier
                                                            }{' '}
                                                            •{' '}
                                                            {
                                                                transaction.payment_method
                                                            }
                                                        </p>

                                                        <p className="text-xs text-gray-400">
                                                            {formatDateTime(
                                                                transaction.created_at
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="font-semibold text-gray-900">
                                                            {formatCurrency(
                                                                transaction.total_amount
                                                            )}
                                                        </p>

                                                        <span
                                                            className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                                                                transaction.status
                                                            )}`}
                                                        >
                                                            {
                                                                transaction.status
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                                        No recent transactions.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}


                {showCloseModal && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="close-business-day-title"
                        >
                            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-red-100 p-3 text-red-600">
                                        <span className="text-xl">!</span>
                                    </div>

                                    <div>
                                        <h2
                                            id="close-business-day-title"
                                            className="text-xl font-bold text-gray-900"
                                        >
                                            Close POS / Branch?
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Business date: {businessDate ?? '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm text-gray-600">
                                    <p>
                                        Closing the branch business day will generate its final
                                        Z-Reading.
                                    </p>

                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>All cashier shifts must be closed.</li>
                                        <li>Sales totals will be saved in the Z-Reading.</li>
                                        <li>New sales and normal voids for this business day will be blocked.</li>
                                        <li>The saved Z-Reading can be retrieved for reprinting.</li>
                                    </ul>
                                </div>

                                {isRecoveryClose && (
                                    <div className="mt-5">
                                        <label
                                            htmlFor="recovery-reason"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Recovery reason (required)
                                        </label>

                                        <textarea
                                            id="recovery-reason"
                                            value={recoveryReason}
                                            onChange={(event) =>
                                                setRecoveryReason(event.target.value)
                                            }
                                            rows={3}
                                            maxLength={2000}
                                            placeholder="Explain why the previous business day was not closed on time."
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                        />
                                    </div>
                                )}

                                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={confirmedClose}
                                        onChange={(event) =>
                                            setConfirmedClose(event.target.checked)
                                        }
                                        className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />

                                    <span>
                                        I have verified that all shifts are closed and the branch
                                        is ready to close.
                                    </span>
                                </label>

                                {closeError && (
                                    <div
                                        role="alert"
                                        className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                                    >
                                        {closeError}
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        disabled={closeLoading}
                                        onClick={() => {
                                            setShowCloseModal(false);
                                            setCloseError(null);
                                        }}
                                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !confirmedClose ||
                                            closeLoading ||
                                            (isRecoveryClose && !recoveryReason.trim())
                                        }
                                        onClick={handleCloseBusinessDay}
                                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {closeLoading ? 'Closing business day...' : 'Confirm close'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </AuthenticatedLayout>
    );
}