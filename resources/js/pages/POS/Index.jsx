import { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [shift, setShift] = useState(null);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentReference, setPaymentReference] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [saleResult, setSaleResult] = useState(null);

    const [completedChange, setCompletedChange] = useState(0);

    const [completedPaymentMethod, setCompletedPaymentMethod] =
    useState('cash');

    const [completedAmountPaid, setCompletedAmountPaid] = useState(0);

    const [completedPaymentReference, setCompletedPaymentReference] =
        useState('');

    const [completedTotal, setCompletedTotal] = useState(0);

    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [transactionsError, setTransactionsError] = useState('');

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState('');

    const [showReceipt, setShowReceipt] = useState(false);

    const [receiptMode, setReceiptMode] = useState('preview');

    const [showOpenShift, setShowOpenShift] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [openingNotes, setOpeningNotes] = useState('');
    const [openingShiftLoading, setOpeningShiftLoading] = useState(false);
    const [shiftLoading, setShiftLoading] = useState(true);

    const loadCurrentShift = async () => {
        try {
            setShiftLoading(true);
            setError(null);

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

            const currentShift = result.data?.shift ?? null;

            setShift(currentShift);

            return currentShift;
        } catch (error) {
            setShift(null);
            setError(error.message);
            throw error;
        } finally {
            setShiftLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await fetch('/api/pos/products', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load POS products.'
                );
            }

            setProducts(result.data?.products ?? []);

            return result.data;
        } catch (error) {
            setProducts([]);
            setError(error.message);
            throw error;
        }
    };

    const initializePOS = async () => {
        try {
            setLoading(true);
            setError(null);

            const currentShift = await loadCurrentShift();

            if (currentShift) {
                await loadProducts();
            } else {
                setProducts([]);
            }
        } catch {
            // Error state is already handled by the individual functions.
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async () => {
        const numericOpeningCash = Number(openingCash);

        if (!Number.isFinite(numericOpeningCash) || numericOpeningCash < 0) {
            setError('Opening cash must be a valid amount.');
            return;
        }

        setOpeningShiftLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/shifts/open', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opening_cash: numericOpeningCash,
                    opening_notes: openingNotes.trim() || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to open shift.'
                );
            }

            setOpeningCash('');
            setOpeningNotes('');
            setShowOpenShift(false);

            await initializePOS();
        } catch (error) {
            setError(error.message);
        } finally {
            setOpeningShiftLoading(false);
        }
    };

        useEffect(() => {
            initializePOS();
            loadTransactions();
        }, []);

    const addToCart = (product) => {
        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (item) => item.id === product.id
            );

            if (existingItem) {
                if (existingItem.quantity >= product.max_quantity) {
                    return currentCart;
                }

                return currentCart.map((item) =>
                    item.id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                          }
                        : item
                );
            }

            return [
                ...currentCart,
                {
                    ...product,
                    quantity: 1,
                },
            ];
        });
    };

    const increaseQuantity = (productId) => {
        setCart((currentCart) =>
            currentCart.map((item) => {
                if (item.id !== productId) {
                    return item;
                }

                if (item.quantity >= item.max_quantity) {
                    return item;
                }

                return {
                    ...item,
                    quantity: item.quantity + 1,
                };
            })
        );
    };

    const decreaseQuantity = (productId) => {
        setCart((currentCart) =>
            currentCart
                .map((item) => {
                    if (item.id !== productId) {
                        return item;
                    }

                    return {
                        ...item,
                        quantity: item.quantity - 1,
                    };
                })
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (productId) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== productId)
        );
    };

    const cartTotal = cart.reduce(
        (total, item) =>
            total + Number(item.selling_price) * item.quantity,
        0
    );

    const numericAmountPaid = Number(amountPaid) || 0;

    const change =
        paymentMethod === 'cash'
            ? Math.max(numericAmountPaid - cartTotal, 0)
            : 0;

    const cashPaymentValid =
        paymentMethod === 'cash' &&
        numericAmountPaid >= cartTotal;

    const gcashPaymentValid =
        paymentMethod === 'gcash' &&
        numericAmountPaid === cartTotal &&
        paymentReference.trim() !== '';

    const paymentValid =
        cart.length > 0 &&
        (cashPaymentValid || gcashPaymentValid);

    const proceedToPayment = () => {
        if (cart.length === 0) {
            return;
        }

        setShowPayment(true);
        setPaymentMethod('cash');
        setAmountPaid('');
        setPaymentReference('');
    };    


    const completeSale = async () => {
        if (!paymentValid || submitting) {
            return;
        }

        setSubmitting(true);
        setError(null);
        setSaleResult(null);
        

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    warehouse_id: shift.warehouse_id,
                    items: cart.map((item) => ({
                        product_id: item.id,
                        quantity: item.quantity,
                    })),
                    payment_method: paymentMethod,
                    amount_paid:
                        paymentMethod === 'cash'
                            ? numericAmountPaid
                            : cartTotal,
                    payment_reference:
                        paymentMethod === 'gcash'
                            ? paymentReference.trim()
                            : null,
                }),
            });

            const result = await response.json();

            //console.log('SALE API RESPONSE:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Failed to complete sale.');
            }

            setSaleResult(result);
            setCompletedTotal(Number(result.data.sale.total_amount));
            setCompletedChange(Number(result.data.change_amount));
            setCompletedPaymentMethod(paymentMethod);
            setCompletedAmountPaid(
                paymentMethod === 'cash'
                    ? numericAmountPaid
                    : cartTotal
            );
            setCompletedPaymentReference(
                paymentMethod === 'gcash'
                    ? paymentReference.trim()
                    : ''
            );

            await loadProducts();
            await loadTransactions();

            setCart([]);
            setPaymentMethod('cash');
            setAmountPaid('');
            setPaymentReference('');
            setShowPayment(false);
        } catch (error) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };


    const startNewSale = async () => {
        setSaleResult(null);
        setCompletedChange(0);
        setCompletedPaymentMethod('cash');
        setCompletedAmountPaid(0);
        setCompletedPaymentReference('');
        setError(null);

        setCart([]);
        setShowPayment(false);
        setPaymentMethod('cash');
        setAmountPaid('');
        setPaymentReference('');

        try {
            await loadProducts();
        } catch {
            // loadProducts already sets the error state.
        }
    };

    const loadTransactions = async () => {
        try {
            setTransactionsLoading(true);
            setTransactionsError('');

            const response = await fetch('/api/pos/transactions', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load transactions.'
                );
            }

            setTransactions(result.data ?? []);
        } catch (error) {
            setTransactionsError(error.message);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const loadTransaction = async (saleId) => {
        try {
            setTransactionLoading(true);
            setTransactionError('');

            const response = await fetch(
                `/api/pos/transactions/${saleId}`,
                {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to load transaction.'
                );
            }

            setSelectedTransaction(result.data);
        } catch (error) {
            setTransactionError(error.message);
        } finally {
            setTransactionLoading(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Point of Sale
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Select products to add them to the cart.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {shift ? (
                                <>
                                    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                                            <p className="text-xs font-medium text-gray-500">
                                                Active Shift
                                            </p>
                                        </div>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            Shift #{shift.id}
                                        </p>

                                        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                                            <p>
                                                Branch:{' '}
                                                <span className="font-medium text-gray-700">
                                                    {shift.branch?.name || '—'}
                                                </span>
                                            </p>

                                            <p>
                                                Warehouse:{' '}
                                                <span className="font-medium text-gray-700">
                                                    {shift.warehouse?.name || '—'}
                                                </span>
                                            </p>

                                            <p>
                                                Opening Cash:{' '}
                                                <span className="font-medium text-gray-700">
                                                    ₱
                                                    {Number(
                                                        shift.opening_cash ?? 0
                                                    ).toLocaleString('en-PH', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href="/shift"
                                        className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                                    >
                                        Close Shift
                                    </a>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setOpeningCash('');
                                        setOpeningNotes('');
                                        setShowOpenShift(true);
                                    }}
                                    className="rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                                >
                                    Open Shift
                                </button>
                            )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
                        <p className="font-medium text-red-700">
                            {error}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setShowPayment(false);
                                }}
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Back to Cart
                            </button>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Reload POS
                            </button>
                        </div>
                    </div>
                )}

                
            {/* Sale Completed Modal */}
            {saleResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
                    <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        {/* Success Header */}
                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <span className="text-3xl font-bold text-green-600">
                                    ✓
                                </span>
                            </div>

                            <h2 className="mt-4 text-2xl font-bold text-gray-900">
                                Sale Completed!
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Payment has been recorded successfully.
                            </p>
                        </div>

                        {/* Transaction Number */}
                        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                Transaction Number
                            </p>

                            <p className="mt-2 break-all text-sm font-bold text-gray-900">
                                {saleResult.data?.sale?.sale_number}
                            </p>
                        </div>

                        {/* Total */}
                        <div className="mt-4 rounded-xl bg-green-50 p-5 text-center">
                            <p className="text-sm font-medium text-green-700">
                                Total Paid
                            </p>

                            <p className="mt-1 text-3xl font-bold text-green-700">
                                ₱{completedTotal.toFixed(2)}
                            </p>

                            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                                {completedPaymentMethod} Payment
                            </span>
                        </div>

                        {/* Payment Details */}
                        <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
                            {completedPaymentMethod === 'cash' && (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-500">
                                            Amount Received
                                        </span>

                                        <span className="font-semibold text-gray-900">
                                            ₱{completedAmountPaid.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                                        <span className="font-semibold text-gray-700">
                                            Change
                                        </span>

                                        <span className="text-xl font-bold text-green-600">
                                            ₱{completedChange.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}

                            {completedPaymentMethod === 'gcash' && (
                                <div>
                                    <p className="text-sm text-gray-500">
                                        GCash Reference Number
                                    </p>

                                    <p className="mt-1 break-all font-semibold text-gray-900">
                                        {completedPaymentReference}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                 onClick={() => {
                                    setSelectedTransaction(saleResult.data?.sale);
                                    setReceiptMode('preview');
                                    setShowReceipt(true);
                                }}
                                className="cursor-pointer rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                View Receipt
                            </button>

                            <button
                                type="button"
                                onClick={startNewSale}
                                className="cursor-pointer rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
                            >
                                New Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}


                {/** open shift modal */}

                {showOpenShift && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Open Shift
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Enter the opening cash amount for this shift.
                                </p>
                            </div>

                            <div className="mt-6 space-y-5">
                                <div>
                                    <label
                                        htmlFor="opening-cash"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Opening Cash
                                    </label>

                                    <input
                                        id="opening-cash"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={openingCash}
                                        onChange={(event) =>
                                            setOpeningCash(event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Enter opening cash"
                                        disabled={openingShiftLoading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="opening-notes"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Opening Notes
                                    </label>

                                    <textarea
                                        id="opening-notes"
                                        rows="3"
                                        value={openingNotes}
                                        onChange={(event) =>
                                            setOpeningNotes(event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Optional notes"
                                        disabled={openingShiftLoading}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowOpenShift(false)}
                                    disabled={openingShiftLoading}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleOpenShift}
                                    disabled={
                                        openingShiftLoading ||
                                        openingCash === ''
                                    }
                                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {openingShiftLoading
                                        ? 'Opening...'
                                        : 'Open Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/** transaction details modal */}

                {selectedTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Transaction Details
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedTransaction.sale_number}
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptMode('preview');
                                            setShowReceipt(true);
                                        }}
                                        className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Receipt Preview
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptMode('reprint');
                                            setShowReceipt(true);
                                        }}
                                        className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                    >
                                        Reprint Receipt
                                    </button>
                                </div>
                            </div>

                            {transactionLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    Loading transaction...
                                </div>
                            ) : transactionError ? (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {transactionError}
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Transaction #
                                            </p>

                                            <p className="font-semibold text-gray-900">
                                                {selectedTransaction.sale_number}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Date & Time
                                            </p>

                                            <p className="font-semibold text-gray-900">
                                                {new Date(
                                                    selectedTransaction.created_at
                                                ).toLocaleString()}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Branch
                                            </p>

                                            <p className="font-semibold text-gray-900">
                                                {selectedTransaction.branch?.name}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Staff
                                            </p>

                                            <p className="font-semibold text-gray-900">
                                                {selectedTransaction.user?.first_name}{' '}
                                                {selectedTransaction.user?.last_name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6 overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                                        Product
                                                    </th>

                                                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                                                        Qty
                                                    </th>

                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                        Price
                                                    </th>

                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                                        Subtotal
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {selectedTransaction.items?.map(
                                                    (item) => (
                                                        <tr
                                                            key={item.id}
                                                            className="border-t"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-gray-900">
                                                                    {item.product?.name}
                                                                </p>

                                                                <p className="text-xs text-gray-500">
                                                                    {item.product?.sku}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                {Number(
                                                                    item.quantity
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 text-right">
                                                                ₱
                                                                {Number(
                                                                    item.unit_price
                                                                ).toFixed(2)}
                                                            </td>

                                                            <td className="px-4 py-3 text-right font-medium">
                                                                ₱
                                                                {Number(
                                                                    item.subtotal
                                                                ).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="ml-auto max-w-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">
                                                Subtotal
                                            </span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.subtotal
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-500">
                                                Discount
                                            </span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.discount_amount
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                            <span>Total</span>

                                            <span>
                                                ₱
                                                {Number(
                                                    selectedTransaction.total_amount
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        {selectedTransaction.payments?.map(
                                            (payment) => {
                                                const change =
                                                    Number(payment.amount) -
                                                    Number(
                                                        selectedTransaction.total_amount
                                                    );

                                                return (
                                                    <div
                                                        key={payment.id}
                                                        className="mt-4 border-t pt-4 text-sm"
                                                    >
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">
                                                                Payment
                                                            </span>

                                                            <span className="font-medium capitalize">
                                                                {payment.method}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">
                                                                Amount Paid
                                                            </span>

                                                            <span>
                                                                ₱
                                                                {Number(
                                                                    payment.amount
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {payment.method ===
                                                            'cash' && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">
                                                                    Change
                                                                </span>

                                                                <span>
                                                                    ₱
                                                                    {Math.max(
                                                                        change,
                                                                        0
                                                                    ).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {payment.method ===
                                                            'gcash' &&
                                                            payment.reference_number && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-500">
                                                                        GCash Reference
                                                                    </span>

                                                                    <span>
                                                                        {
                                                                            payment.reference_number
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedTransaction(null)
                                            }
                                            className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/** view receipt modal */}

                {showReceipt && selectedTransaction && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-gray-100 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                    Receipt Preview
                </h2>

                <button
                    type="button"
                    onClick={() => setShowReceipt(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            <div className="receipt-print-area bg-white p-6 font-mono text-sm text-gray-900">
                <div className="text-center">
                    <h1 className="text-lg font-bold">
                        SME POS
                    </h1>

                    <p>
                        {selectedTransaction.branch?.name}
                    </p>

                    {selectedTransaction.branch?.address && (
                        <p>
                            {selectedTransaction.branch.address}
                        </p>
                    )}

                    {selectedTransaction.branch?.contact_number && (
                        <p>
                            {selectedTransaction.branch.contact_number}
                        </p>
                    )}
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span>Transaction:</span>

                        <span className="text-right">
                            {selectedTransaction.sale_number}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Date:</span>

                        <span>
                            {new Date(
                                selectedTransaction.created_at
                            ).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Staff:</span>

                        <span>
                            {selectedTransaction.user?.first_name}{' '}
                            {selectedTransaction.user?.last_name}
                        </span>
                    </div>
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="space-y-3">
                    {selectedTransaction.items?.map((item) => (
                        <div key={item.id}>
                            <div className="font-semibold">
                                {item.product?.name}
                            </div>

                            <div className="flex justify-between">
                                <span>
                                    {Number(item.quantity)} × ₱
                                    {Number(
                                        item.unit_price
                                    ).toFixed(2)}
                                </span>

                                <span>
                                    ₱
                                    {Number(
                                        item.subtotal
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal</span>

                        <span>
                            ₱
                            {Number(
                                selectedTransaction.subtotal
                            ).toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Discount</span>

                        <span>
                            ₱
                            {Number(
                                selectedTransaction.discount_amount
                            ).toFixed(2)}
                        </span>
                    </div>

                    <div className="mt-2 flex justify-between text-base font-bold">
                        <span>TOTAL</span>

                        <span>
                            ₱
                            {Number(
                                selectedTransaction.total_amount
                            ).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                {selectedTransaction.payments?.map((payment) => (
                    <div
                        key={payment.id}
                        className="space-y-1"
                    >
                        <div className="flex justify-between">
                            <span>Payment</span>

                            <span className="uppercase">
                                {payment.method}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Amount Paid</span>

                            <span>
                                ₱
                                {Number(
                                    payment.amount
                                ).toFixed(2)}
                            </span>
                        </div>

                        {payment.method === 'cash' && (
                            <div className="flex justify-between font-semibold">
                                <span>Change</span>

                                <span>
                                    ₱
                                    {Math.max(
                                        Number(payment.amount) -
                                            Number(
                                                selectedTransaction.total_amount
                                            ),
                                        0
                                    ).toFixed(2)}
                                </span>
                            </div>
                        )}

                        {payment.method === 'gcash' &&
                            payment.reference_number && (
                                <div className="flex justify-between">
                                    <span>GCash Ref.</span>

                                    <span>
                                        {
                                            payment.reference_number
                                        }
                                    </span>
                                </div>
                            )}
                    </div>
                ))}

                <div className="my-4 border-t border-dashed border-gray-400" />

                <div className="text-center text-xs">
                    <p>Thank you for your purchase!</p>
                </div>
            </div>

            <div className="receipt-print-actions mt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setShowReceipt(false)}
                    className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Close Preview
                </button>

                <button
                    type="button"
                    onClick={() => window.print()}
                    className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Print Receipt
                </button>
            </div>
        </div>
    </div>
)}
                

                {/* Main POS Area */}
                {!loading && !shift ? (
                    <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
                        <h2 className="text-xl font-bold text-gray-900">
                            No Open Shift
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            You must open a shift before you can start making sales.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setOpeningCash('');
                                setOpeningNotes('');
                                setShowOpenShift(true);
                            }}
                            className="mt-5 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                        >
                            Open Shift
                        </button>
                    </div>
                ) : !loading && shift && !error ? (
                    <>
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
        
                
                        {/* Products */}
                        <div className="lg:col-span-2">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Products
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Select a product to add it to the cart.
                                    </p>
                                </div>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                                    {products.length} product{products.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {products.length === 0 ? (
                                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                        <span className="text-2xl text-gray-400">
                                            🛒
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                        No Products Available
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        There are currently no products available for sale.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {products.map((product) => {
                                        const cartItem = cart.find(
                                            (item) => item.id === product.id
                                        );

                                        const cartQuantity =
                                            cartItem?.quantity ?? 0;

                                        const canAdd =
                                            product.can_sell &&
                                            cartQuantity < product.max_quantity;

                                        const isOutOfStock =
                                            !product.can_sell ||
                                            product.max_quantity <= 0;

                                        const remainingQuantity = Math.max(
                                            product.max_quantity - cartQuantity,
                                            0
                                        );

                                        return (
                                            <div
                                                key={product.id}
                                                className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {product.name}
                                                        </h3>

                                                        {product.sku && (
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                {product.sku}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            isOutOfStock
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}
                                                    >
                                                        {isOutOfStock
                                                            ? 'Out of Stock'
                                                            : 'Available'}
                                                    </span>
                                                </div>

                                                <p className="mt-4 text-2xl font-bold text-blue-600">
                                                    ₱
                                                    {Number(
                                                        product.selling_price
                                                    ).toFixed(2)}
                                                </p>

                                                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">
                                                            Available
                                                        </span>

                                                        <span className="font-semibold text-gray-800">
                                                            {product.max_quantity}
                                                        </span>
                                                    </div>

                                                    {cartQuantity > 0 && (
                                                        <div className="mt-1 flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">
                                                                In cart
                                                            </span>

                                                            <span className="font-semibold text-blue-600">
                                                                {cartQuantity}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(product)}
                                                    disabled={!canAdd}
                                                    className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold transition ${
                                                        canAdd
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                                            : 'cursor-not-allowed bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {isOutOfStock
                                                        ? 'Out of Stock'
                                                        : cartQuantity >=
                                                            product.max_quantity
                                                        ? 'Maximum Reached'
                                                        : `Add to Cart${
                                                                remainingQuantity > 0
                                                                    ? ` (${remainingQuantity} left)`
                                                                    : ''
                                                            }`}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart */}
                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Cart
                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Review your order before payment.
                                    </p>
                                </div>

                                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                    {cart.reduce(
                                        (total, item) => total + item.quantity,
                                        0
                                    )}{' '}
                                    item(s)
                                </span>
                            </div>

                            {cart.length === 0 ? (
                                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                                        <span className="text-2xl">🛒</span>
                                    </div>

                                    <h3 className="mt-4 font-semibold text-gray-900">
                                        Your cart is empty
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Select a product to start a new sale.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                                {cart.map((item) => {
                                const itemSubtotal =
                                    Number(item.selling_price) *
                                    item.quantity;

                                const atMaximum =
                                    item.quantity >= item.max_quantity;

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-gray-200 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900">
                                                    {item.name}
                                                </h3>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    ₱
                                                    {Number(
                                                        item.selling_price
                                                    ).toFixed(2)}{' '}
                                                    each
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                                className="cursor-pointer shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">
                                                    Quantity
                                                </p>

                                                <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decreaseQuantity(
                                                                item.id
                                                            )
                                                        }
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                        className="flex h-9 w-9 items-center justify-center text-lg font-medium text-gray-700 transition hover:bg-gray-100"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="flex h-9 min-w-10 items-center justify-center border-x border-gray-300 px-2 text-sm font-bold text-gray-900">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            increaseQuantity(
                                                                item.id
                                                            )
                                                        }
                                                        disabled={atMaximum}
                                                        aria-label={`Increase ${item.name} quantity`}
                                                        className="flex h-9 w-9 items-center justify-center text-lg font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {atMaximum && (
                                                    <p className="mt-1 text-xs text-amber-600">
                                                        Maximum available quantity
                                                        reached.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">
                                                    Subtotal
                                                </p>

                                                <p className="mt-1 text-lg font-bold text-gray-900">
                                                    ₱
                                                    {itemSubtotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                                                                {showPayment && (
                                    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm lg:col-span-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    Payment
                                                </h2>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Complete the payment for this order.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setShowPayment(false)}
                                                className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                            >
                                                Back to Cart
                                            </button>
                                        </div>

                                        <div className="mt-6">
                                            
                                            {/* Order Summary 
                                            <div className="rounded-lg bg-gray-50 p-5">
                                                <h3 className="font-semibold text-gray-900">
                                                    Order Summary
                                                </h3>

                                                <div className="mt-4 space-y-3">
                                                    {cart.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex justify-between text-sm"
                                                        >
                                                            <span className="text-gray-600">
                                                                {item.name} × {item.quantity}
                                                            </span>

                                                            <span className="font-medium text-gray-900">
                                                                ₱
                                                                {(
                                                                    Number(item.selling_price) *
                                                                    item.quantity
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-5 border-t pt-4">
                                                    <div className="flex justify-between text-lg font-bold">
                                                        <span>Total</span>

                                                        <span>
                                                            ₱{cartTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>*/}

                                            {/* Payment Details */}
                                            <div>
                                                <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        Payment Method
                                                    </h3>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Select how the customer will pay.
                                                    </p>
                                                </div>

                                                <span className="text-sm font-medium text-gray-500">
                                                    Total:{' '}
                                                    <span className="font-bold text-gray-900">
                                                        ₱{cartTotal.toFixed(2)}
                                                    </span>
                                                </span>
                                            </div>

                                                     {/* Payment Method Buttons */}
                                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPaymentMethod('cash');
                                                                    setAmountPaid('');
                                                                    setPaymentReference('');
                                                                }}
                                                                className={`rounded-xl border-2 px-5 py-5 text-left transition ${
                                                                    paymentMethod === 'cash'
                                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 cursor-pointer'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold">
                                                                        Cash
                                                                    </span>

                                                                    {paymentMethod === 'cash' && (
                                                                        <span className="text-sm">
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Pay with cash
                                                                </p>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPaymentMethod('gcash');
                                                                    setAmountPaid(cartTotal.toFixed(2));
                                                                }}
                                                                className={`rounded-xl border-2 px-5 py-5 text-left transition ${
                                                                    paymentMethod === 'gcash'
                                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 cursor-pointer'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold">
                                                                        GCash
                                                                    </span>

                                                                    {paymentMethod === 'gcash' && (
                                                                        <span className="text-sm">
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Digital payment
                                                                </p>
                                                            </button>
                                                        </div>

                                                 {/* Cash Payment */}
                                                    {paymentMethod === 'cash' && (
                                                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
                                                            <label
                                                                htmlFor="amount-paid"
                                                                className="mb-2 block text-sm font-semibold text-gray-700"
                                                            >
                                                                Amount Received
                                                            </label>

                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                                    ₱
                                                                </span>

                                                                <input
                                                                    id="amount-paid"
                                                                    type="number"
                                                                    min={cartTotal}
                                                                    step="0.01"
                                                                    value={amountPaid}
                                                                    onChange={(event) =>
                                                                        setAmountPaid(event.target.value)
                                                                    }
                                                                    className={`w-full rounded-lg border py-3 pl-9 pr-4 text-lg font-semibold focus:outline-none focus:ring-2 ${
                                                                        amountPaid !== '' &&
                                                                        numericAmountPaid < cartTotal
                                                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                                                    }`}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>

                                                            {amountPaid !== '' &&
                                                                numericAmountPaid < cartTotal && (
                                                                    <p className="mt-2 text-sm font-medium text-red-600">
                                                                        Insufficient payment. Customer still needs ₱
                                                                        {(
                                                                            cartTotal - numericAmountPaid
                                                                        ).toFixed(2)}
                                                                    </p>
                                                                )}

                                                            <div className="mt-4 rounded-xl bg-gray-50 p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-gray-500">
                                                                        Order Total
                                                                    </span>

                                                                    <span className="font-semibold text-gray-900">
                                                                        ₱{cartTotal.toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex items-center justify-between border-t pt-3">
                                                                    <span className="font-semibold text-gray-700">
                                                                        Change
                                                                    </span>

                                                                    <span
                                                                        className={`text-xl font-bold ${
                                                                            cashPaymentValid
                                                                                ? 'text-green-600'
                                                                                : 'text-gray-400'
                                                                        }`}
                                                                    >
                                                                        ₱{change.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                 {/* GCash Payment */}
                                                    {paymentMethod === 'gcash' && (
                                                        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
                                                            <div className="flex items-center justify-between">
                                                                <label
                                                                    htmlFor="payment-reference"
                                                                    className="block text-sm font-semibold text-gray-700"
                                                                >
                                                                    GCash Reference Number
                                                                </label>

                                                                <span className="text-xs font-medium text-red-500">
                                                                    Required
                                                                </span>
                                                            </div>

                                                            <input
                                                                id="payment-reference"
                                                                type="text"
                                                                value={paymentReference}
                                                                onChange={(event) =>
                                                                    setPaymentReference(event.target.value)
                                                                }
                                                                className={`mt-2 w-full rounded-lg border px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 ${
                                                                    paymentReference.trim() === ''
                                                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                                                        : 'border-green-300 focus:border-green-500 focus:ring-green-100'
                                                                }`}
                                                                placeholder="Enter reference number"
                                                            />

                                                            <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3">
                                                                <p className="text-sm text-blue-700">
                                                                    GCash payment amount:
                                                                    <span className="ml-1 font-bold">
                                                                        ₱{cartTotal.toFixed(2)}
                                                                    </span>
                                                                </p>

                                                                <p className="mt-1 text-xs text-blue-600">
                                                                    The payment must exactly match the order total.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                {/* Complete Sale */}
                                                <div className="mt-6">
                                                    <button
                                                        type="button"
                                                        onClick={completeSale}
                                                        disabled={!paymentValid || submitting}
                                                        className={`w-full rounded-xl px-4 py-4 text-lg font-bold text-white transition ${
                                                            paymentValid && !submitting
                                                                ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                                                : 'cursor-not-allowed bg-gray-300'
                                                        }`}
                                                    >
                                                        {submitting ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                Processing Sale...
                                                            </span>
                                                        ) : (
                                                            <>
                                                                Complete Sale · ₱{cartTotal.toFixed(2)}
                                                            </>
                                                        )}
                                                    </button>

                                                    {!paymentValid && !submitting && (
                                                        <p className="mt-2 text-center text-xs text-gray-500">
                                                            Complete the payment details above to continue.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                
                                    {/* Total */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-500">
                                                Order Total
                                            </span>

                                            <span className="text-2xl font-bold text-gray-900">
                                                ₱{cartTotal.toFixed(2)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={proceedToPayment}
                                            disabled={cart.length === 0 || showPayment}
                                            className="cursor-pointer mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >
                                             {showPayment ? 'Payment in Progress' : 'Proceed to Payment'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        
                    </div>

                     {/** Recent Transactions */}
                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Recent Transactions
                                            </h2>

                                            <p className="text-sm text-gray-500">
                                                Your 10 most recent completed sales
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={loadTransactions}
                                            disabled={transactionsLoading}
                                            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Refresh
                                        </button>
                                    </div>

                                    {transactionsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                                        <p className="mt-4 text-sm font-medium text-gray-700">
                                            Loading transactions...
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Please wait while we retrieve recent sales.
                                        </p>
                                    </div>
                                ) : transactionsError ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                                                !
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-semibold text-red-800">
                                                    Unable to Load Transactions
                                                </h3>

                                                <p className="mt-1 text-sm text-red-700">
                                                    {transactionsError}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={loadTransactions}
                                                    disabled={transactionsLoading}
                                                    className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                                            <icon name="receipt-text" size="xl" />
                                        </div>

                                        <h3 className="mt-4 font-semibold text-gray-900">
                                            No Transactions Yet
                                        </h3>

                                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                                            Completed sales will appear here once you start processing orders.
                                        </p>
                                    </div>
                                ) : (
                                        
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                                                        <th className="px-4 py-3 font-semibold">
                                                            Transaction
                                                        </th>

                                                        <th className="px-4 py-3 font-semibold">
                                                            Payment
                                                        </th>

                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Total
                                                        </th>

                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Date
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-gray-100">
                                                    {transactions.map((transaction) => {
                                                        const payment = transaction.payments?.[0];

                                                        return (
                                                            <tr
                                                                key={transaction.id}
                                                                onClick={() => loadTransaction(transaction.id)}
                                                                className="cursor-pointer transition-colors hover:bg-blue-50/50"
                                                                title="Click to view transaction details"
                                                            >
                                                                <td className="px-4 py-4">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {transaction.sale_number}
                                                                    </div>

                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Transaction ID: #{transaction.id}
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-4">
                                                                    {payment?.method ? (
                                                                        <span
                                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                                                payment.method === 'cash'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : payment.method === 'gcash'
                                                                                    ? 'bg-blue-100 text-blue-700'
                                                                                    : 'bg-gray-100 text-gray-700'
                                                                            }`}
                                                                        >
                                                                            {payment.method}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">—</span>
                                                                    )}

                                                                    {payment?.method === 'gcash' &&
                                                                        payment?.reference_number && (
                                                                            <div className="mt-2 max-w-40 truncate text-xs text-gray-500">
                                                                                Ref: {payment.reference_number}
                                                                            </div>
                                                                        )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-900">
                                                                    ₱{Number(transaction.total_amount).toFixed(2)}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-4 text-right text-gray-500">
                                                                    <div>
                                                                        {new Date(
                                                                            transaction.created_at
                                                                        ).toLocaleDateString()}
                                                                    </div>

                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                        {new Date(
                                                                            transaction.created_at
                                                                        ).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                    )}
                                </div>
                    </>
                ) : null}
             
            </div>
        </AuthenticatedLayout>
    );
}