import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function CurrentShift() {
    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [openingCash, setOpeningCash] = useState('');
    const [openingNotes, setOpeningNotes] = useState('');

    const [actualCash, setActualCash] = useState('');
    const [closingNotes, setClosingNotes] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

            setShift(result.data?.shift ?? result.data ?? null);
        } catch (error) {
            setError(error.message || 'Failed to load current shift.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentShift();
    }, []);

    const handleOpenShift = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setSubmitError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/shifts/open', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opening_cash: Number(openingCash),
                    opening_notes: openingNotes.trim() || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to open shift.'
                );
            }

            setSuccessMessage('Shift opened successfully.');
            setOpeningCash('');
            setOpeningNotes('');

            await loadCurrentShift();
        } catch (error) {
            setSubmitError(error.message || 'Failed to open shift.');
        } finally {
            setSubmitting(false);
        }
    };

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
            setOpeningCash('');
            setOpeningNotes('');

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

    return (
        <AuthenticatedLayout>
            <Head title="Current Shift" />

            <div className="py-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Current Shift
                        </h1>

                        <p className="mt-1 text-sm text-gray-600">
                            Open and close your POS shift and reconcile cash.
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
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Open Shift
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Enter the amount of cash physically placed
                                    in the register before starting sales.
                                </p>
                            </div>

                            <form
                                onSubmit={handleOpenShift}
                                className="space-y-5"
                            >
                                <div>
                                    <label
                                        htmlFor="opening_cash"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Opening Cash
                                    </label>

                                    <input
                                        id="opening_cash"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={openingCash}
                                        onChange={(event) =>
                                            setOpeningCash(event.target.value)
                                        }
                                        required
                                        disabled={submitting}
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="opening_notes"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Opening Notes
                                    </label>

                                    <textarea
                                        id="opening_notes"
                                        rows={3}
                                        value={openingNotes}
                                        onChange={(event) =>
                                            setOpeningNotes(event.target.value)
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
                                        openingCash === ''
                                    }
                                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting
                                        ? 'Opening Shift...'
                                        : 'Open Shift'}
                                </button>
                            </form>
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