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

    return (
        <AuthenticatedLayout>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Welcome, {user.first_name}!
                    </h2>

                    <p className="mt-2 text-gray-600">
                        You are logged in as {user.role?.name}.
                    </p>

                    {user.branch && (
                        <p className="mt-1 text-sm text-gray-500">
                            Branch: {user.branch.name}
                        </p>
                    )}
                </div>

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
            </div>
        </AuthenticatedLayout>
    );
}