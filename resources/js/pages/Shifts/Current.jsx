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
    const [printReading, setPrintReading] = useState(null);
    const [autoPrintReading, setAutoPrintReading] = useState(false);
    const [showZReading, setShowZReading] = useState(false);
    const [closedShift, setClosedShift] = useState(null);
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

    // Print the saved X-reading after the close response has rendered.
    useEffect(() => {
        if (!autoPrintReading || !printReading) return;
        const timer = window.setTimeout(() => {
            window.print();
            setAutoPrintReading(false);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [autoPrintReading, printReading]);
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
            const closed = result.data?.shift ?? null;
            const reading = closed?.reading ?? null;

            setSuccessMessage('Shift closed successfully.');
            setClosedShift(closed);
            setPrintReading(reading);
            setShift(null);
            setActualCash('');
            setClosingNotes('');
            setShowZReading(true);

            // Do not ask staff to close the shift again if a reading is missing.
            if (reading) {
                setAutoPrintReading(true);
            } else {
                setSubmitError(
                    'The shift was closed, but the saved X-reading was not returned. Please contact an administrator.'
                );
            }
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
    const readingSnapshot = printReading?.snapshot ?? {};
    const readingSales = readingSnapshot.sales ?? {};
    const readingCash = readingSnapshot.cash_reconciliation ?? {};
    const readingBranch = readingSnapshot.branch ?? {};
    const readingWarehouse = readingSnapshot.warehouse ?? {};
    const readingCashier = readingSnapshot.cashier ?? {};
    return (
        <AuthenticatedLayout>
            <Head title="Shift Closing" />
            <style>{`
                .x-reading-print { display: none; }
                @media print {
                    @page { size: 80mm auto; margin: 3mm; }
                    body * { visibility: hidden !important; }
                    .x-reading-print,
                    .x-reading-print * { visibility: visible !important; }
                    .x-reading-print {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 74mm;
                        padding: 0;
                        margin: 0;
                        color: #000 !important;
                        background: #fff !important;
                        font: 11px/1.35 Arial, sans-serif;
                    }
                    .x-reading-print h1,
                    .x-reading-print h2,
                    .x-reading-print p { margin: 0 0 4px; }
                    .x-reading-print .print-rule {
                        border-top: 1px dashed #000;
                        margin: 6px 0;
                    }
                    .x-reading-print .print-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .x-reading-print .print-strong { font-weight: 700; }
                }
            `}</style>

            <div className="x-reading-print" aria-hidden="true">
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '16px', fontWeight: 700 }}>X-READING</h1>
                    <p>SHIFT CLOSING REPORT</p>
                    <p>{readingBranch.name || closedShift?.branch?.name || 'Branch'}</p>
                    <p>{readingWarehouse.name || closedShift?.warehouse?.name || 'Warehouse'}</p>
                </div>
                <div className="print-rule" />
                <p><strong>Reading No:</strong> {printReading?.reading_number || '-'}</p>
                <p><strong>Shift ID:</strong> {printReading?.shift_id || closedShift?.id || '-'}</p>
                <p><strong>Cashier:</strong> {readingCashier.name || '-'}</p>
                <p><strong>Opened:</strong> {readingSnapshot.opened_at ? new Date(readingSnapshot.opened_at).toLocaleString() : '-'}</p>
                <p><strong>Closed:</strong> {readingSnapshot.closed_at ? new Date(readingSnapshot.closed_at).toLocaleString() : '-'}</p>
                <div className="print-rule" />
                <h2 style={{ fontWeight: 700 }}>SALES SUMMARY</h2>
                <div className="print-row"><span>Cash ({readingSales.cash?.transaction_count ?? 0})</span><span>{money(readingSales.cash?.total_amount)}</span></div>
                <div className="print-row"><span>GCash ({readingSales.gcash?.transaction_count ?? 0})</span><span>{money(readingSales.gcash?.total_amount)}</span></div>
                <div className="print-row"><span>Voids ({readingSales.voids?.transaction_count ?? 0})</span><span>{money(readingSales.voids?.total_amount)}</span></div>
                <div className="print-row print-strong"><span>Completed Transactions</span><span>{readingSales.completed_transaction_count ?? 0}</span></div>
                <div className="print-rule" />
                <h2 style={{ fontWeight: 700 }}>CASH RECONCILIATION</h2>
                <div className="print-row"><span>Opening Cash</span><span>{money(readingCash.opening_cash)}</span></div>
                <div className="print-row"><span>Expected Cash</span><span>{money(readingCash.expected_cash)}</span></div>
                <div className="print-row"><span>Actual Cash</span><span>{money(readingCash.actual_cash)}</span></div>
                <div className="print-row print-strong"><span>Variance</span><span>{money(readingCash.variance)}</span></div>
                {readingSnapshot.closing_notes && (
                    <>
                        <div className="print-rule" />
                        <p><strong>Closing Notes:</strong></p>
                        <p>{readingSnapshot.closing_notes}</p>
                    </>
                )}
                <div className="print-rule" />
                <p style={{ textAlign: 'center', marginTop: '8px' }}>End of X-reading</p>
            </div>
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
            {showZReading && closedShift && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
                        <div className="border-b px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Z-Reading Summary</h2>
                                    <p className="mt-1 text-sm text-gray-500">Shift closed successfully. Review the final totals below.</p>
                                </div>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Closed</span>
                            </div>
                            {printReading?.reading_number && (
                                <p className="mt-3 text-sm text-gray-600">
                                    X-reading reference: <span className="font-semibold text-gray-900">{printReading.reading_number}</span>
                                </p>
                            )}
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs text-gray-500">Branch</p>
                                    <p className="mt-1 font-semibold text-gray-900">{readingBranch.name || closedShift.branch?.name || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-xs text-gray-500">Cashier</p>
                                    <p className="mt-1 font-semibold text-gray-900">{readingCashier.name || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Sales Summary</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                        <p className="text-sm text-emerald-800">Cash Sales</p>
                                        <p className="mt-1 text-xl font-bold text-emerald-900">{money(readingSales.cash?.total_amount)}</p>
                                        <p className="text-xs text-emerald-800">{readingSales.cash?.transaction_count ?? 0} transaction(s)</p>
                                    </div>
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                        <p className="text-sm text-sky-800">GCash Sales</p>
                                        <p className="mt-1 text-xl font-bold text-sky-900">{money(readingSales.gcash?.total_amount)}</p>
                                        <p className="text-xs text-sky-800">{readingSales.gcash?.transaction_count ?? 0} transaction(s)</p>
                                    </div>
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm text-red-800">Voided Sales</p>
                                        <p className="mt-1 text-xl font-bold text-red-900">{money(readingSales.voids?.total_amount)}</p>
                                        <p className="text-xs text-red-800">{readingSales.voids?.transaction_count ?? 0} transaction(s)</p>
                                    </div>
                                </div>
                                <div className="mt-3 rounded-lg border p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-600">Completed transactions</span>
                                        <span className="font-semibold text-gray-900">{readingSales.completed_transaction_count ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Cash Reconciliation</h3>
                                <div className="space-y-3 rounded-lg border p-4">
                                    {[
                                        ['Opening Cash', readingCash.opening_cash],
                                        ['Expected Cash', readingCash.expected_cash],
                                        ['Actual Cash', readingCash.actual_cash],
                                        ['Cash Variance', readingCash.variance],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-gray-600">{label}</span>
                                            <span className="font-semibold text-gray-900">{money(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {readingSnapshot.closing_notes && (
                                <div className="rounded-lg bg-amber-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Closing Notes</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{readingSnapshot.closing_notes}</p>
                                </div>
                            )}
                            {autoPrintReading && <p className="text-sm text-gray-500">Opening the X-reading print dialog…</p>}
                            {!printReading && (
                                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    The shift is closed, but the X-reading data was not returned. Please ask an administrator to review this shift.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
                            {printReading && (
                                <button type="button" onClick={() => window.print()} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Print X-Reading Again
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowZReading(false);
                                    window.location.href = '/pos';
                                }}
                                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Done — Return to POS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}