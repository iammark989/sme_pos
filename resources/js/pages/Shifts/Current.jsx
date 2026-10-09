import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
export default function CurrentShift() {
    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [shiftSummary, setShiftSummary] = useState(null);
    const loadCurrentShift = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/shifts/current', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load current shift.'
                );
            }
            setShift(result.data?.shift ?? null);
            setShiftSummary(result.data?.summary ?? null);
        } catch (error) {
            setError(error.message || 'Failed to load current shift.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadCurrentShift();
    }, []);
    const handleCloseShift = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError('');
        setSuccessMessage('');
        try {
            const response = await fetch('/api/shifts/close', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    actual_cash: Number(actualCash),
                    closing_notes: closingNotes.trim() || null,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to close shift.'
                );
            }
            setSuccessMessage('Shift closed successfully.');
            setShift(null);
            setActualCash('');
            setClosingNotes('');
            window.location.href = '/pos';
        } catch (error) {
            setSubmitError(error.message || 'Failed to close shift.');
        } finally {
            setSubmitting(false);
        }
    };
    const money = (value) =>
        `₱${Number(value ?? 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    const numericActualCash =
        actualCash === '' ? null : Number(actualCash);
    const expectedCash = Number(shift?.expected_cash ?? 0);
    const cashVariance =
        numericActualCash === null
            ? null
            : numericActualCash - expectedCash;
    const cashVarianceLabel =
        cashVariance === null
            ? ''
            : cashVariance === 0
            ? 'Balanced'
            : cashVariance > 0
                ? 'Cash Over'
                : 'Cash Short';
    return (
        <AuthenticatedLayout>
            <Head title="Shift Closing" />
            <div className="py-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href="/pos"
                            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            <svg
                                className="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                                />
                            </svg>
                            Back to POS
                        </Link>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Shift Closing
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Review shift sales, reconcile cash, and close your shift when ready.
                        </p>
                    </div>
                    {loading && (
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Loading shift...
                            </p>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4">
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-6 rounded-xl bg-green-50 p-4">
                            <p className="text-sm text-green-700">
                                {successMessage}
                            </p>
                        </div>
                    )}
                    {submitError && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4">
                            <p className="text-sm text-red-600">
                                {submitError}
                            </p>
                        </div>
                    )}
                    {!loading && !shift && (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                <svg
                                    className="h-6 w-6 text-gray-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-4 text-lg font-semibold text-gray-900">
                                No Active Shift
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                                There is no open shift to close. Please open a shift from the POS page first.
                            </p>
                            <Link
                                href="/pos"
                                className="mt-5 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                            >
                                Back to POS
                            </Link>
                        </div>
                    )}

                    {!loading && shift && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700">
                                            Shift Status
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        {shift.status}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Branch
                                    </p>
                                    <p className="mt-1 font-semibold text-gray-900">
                                        {shift.branch?.name || '-'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {shift.branch?.code || ''}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Warehouse
                                    </p>
                                    <p className="mt-1 font-semibold text-gray-900">
                                        {shift.warehouse?.name || '-'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {shift.warehouse?.code || ''}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Opened At
                                    </p>
                                    <p className="mt-1 font-semibold text-gray-900">
                                        {shift.opened_at
                                            ? new Date(
                                                  shift.opened_at
                                              ).toLocaleString()
                                            : '-'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Opening Cash
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {money(shift.opening_cash)}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Cash Reconciliation
                                </h2>
                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">
                                            Expected Cash
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {money(shift.expected_cash)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">
                                            Opening Cash
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {money(shift.opening_cash)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Shift Sales Summary */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Shift Sales Summary
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Summary of successful and voided transactions for this shift.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {/* Cash Transactions */}
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-sm font-medium text-emerald-800">
                                            Cash Transactions
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-emerald-900">
                                            {shiftSummary?.cash?.transaction_count ?? 0}
                                        </p>
                                        <p className="mt-1 text-sm text-emerald-800">
                                            ₱{Number(shiftSummary?.cash?.total_amount ?? 0).toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                            )}
                                        </p>
                                    </div>
                                    {/* GCash Transactions */}
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                        <p className="text-sm font-medium text-sky-800">
                                            GCash Transactions
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-sky-900">
                                            {shiftSummary?.gcash?.transaction_count ?? 0}
                                        </p>
                                        <p className="mt-1 text-sm text-sky-800">
                                            ₱{Number(shiftSummary?.gcash?.total_amount ?? 0).toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                            )}
                                        </p>
                                    </div>
                                    {/* Voided Transactions */}
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-medium text-red-800">
                                            Voided Transactions
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-red-900">
                                            {shiftSummary?.voids?.transaction_count ?? 0}
                                        </p>
                                        <p className="mt-1 text-sm text-red-800">
                                            ₱{Number(shiftSummary?.voids?.total_amount ?? 0).toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Close Shift
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Count the actual cash in the register
                                    before closing the shift.
                                </p>
                                <form
                                    onSubmit={handleCloseShift}
                                    className="mt-5 space-y-5"
                                >
                                    <div>
                                        <label
                                            htmlFor="actual_cash"
                                            className="mb-1 block text-sm font-medium text-gray-700"
                                        >
                                            Actual Cash
                                        </label>
                                        <input
                                            id="actual_cash"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={actualCash}
                                            onChange={(event) =>
                                                setActualCash(
                                                    event.target.value
                                                )
                                            }
                                            required
                                            disabled={submitting}
                                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-red-500 focus:ring-red-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {actualCash !== '' && (
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                Expected Cash
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {money(expectedCash)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                Actual Cash
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {money(numericActualCash)}
                                            </span>
                                        </div>
                                        <div className="mt-3 border-t pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-700">
                                                    Variance
                                                </span>
                                                <span
                                                    className={`text-lg font-bold ${
                                                        cashVariance === 0
                                                            ? 'text-green-600'
                                                            : cashVariance > 0
                                                            ? 'text-blue-600'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {cashVariance > 0 ? '+' : ''}
                                                    {money(cashVariance)}
                                                </span>
                                            </div>
                                            <p
                                                className={`mt-1 text-right text-sm font-medium ${
                                                    cashVariance === 0
                                                        ? 'text-green-600'
                                                        : cashVariance > 0
                                                        ? 'text-blue-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {cashVarianceLabel}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                    <div>
                                        <label
                                            htmlFor="closing_notes"
                                            className="mb-1 block text-sm font-medium text-gray-700"
                                        >
                                            Closing Notes
                                        </label>
                                        <textarea
                                            id="closing_notes"
                                            rows={3}
                                            value={closingNotes}
                                            onChange={(event) =>
                                                setClosingNotes(
                                                    event.target.value
                                                )
                                            }
                                            disabled={submitting}
                                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Optional notes..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            actualCash === ''
                                        }
                                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting
                                            ? 'Closing Shift...'
                                            : 'Close Shift'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
