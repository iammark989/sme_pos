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

                setShift(result.data.shift);
                setProducts(result.data.products);

                return result.data;
            } catch (error) {
                setError(error.message);
                throw error;
            }
        };

        useEffect(() => {
            loadProducts()
                .catch(() => {})
                .finally(() => {
                    setLoading(false);
                });
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

            console.log('SALE API RESPONSE:', result);

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

                    {shift && (
                        <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-gray-500">
                                Current Shift
                            </p>

                            <p className="font-semibold text-gray-900">
                                Shift #{shift.id}
                            </p>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
                        <p className="font-medium text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {saleResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                    <span className="text-2xl text-green-600">
                                        ✓
                                    </span>
                                </div>

                                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                                    Sale Completed
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    The transaction has been completed successfully.
                                </p>
                            </div>

                            <div className="mt-6 space-y-4 rounded-xl bg-gray-50 p-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Transaction #
                                    </span>

                                    <span className="text-right text-sm font-semibold text-gray-900">
                                        {saleResult.data?.sale?.sale_number}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Total
                                    </span>

                                    <span className="font-semibold text-gray-900">
                                        ₱{completedTotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Payment
                                    </span>

                                    <span className="font-semibold capitalize text-gray-900">
                                        {completedPaymentMethod}
                                    </span>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                Amount Paid
                                            </span>

                                            <span className="font-semibold text-gray-900">
                                                ₱
                                                {completedAmountPaid.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between border-t pt-4">
                                            <span className="font-medium text-gray-700">
                                                Change
                                            </span>

                                            <span className="text-lg font-bold text-green-600">
                                                ₱{completedChange.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {paymentMethod === 'gcash' && (
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <span className="text-sm text-gray-500">
                                            Reference
                                        </span>

                                        <span className="text-right text-sm font-semibold text-gray-900">
                                            {completedPaymentReference}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={startNewSale}
                                className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
                            >
                                New Sale
                            </button>
                        </div>
                    </div>
                )}

                {/* Main POS Area */}
                {!loading && !error && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        {/* Products */}
                        <div className="lg:col-span-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {products.map((product) => {
                                    const cartItem = cart.find(
                                        (item) => item.id === product.id
                                    );

                                    const cartQuantity =
                                        cartItem?.quantity ?? 0;

                                    const canAdd =
                                        product.can_sell &&
                                        cartQuantity <
                                            product.max_quantity;

                                    return (
                                        <div
                                            key={product.id}
                                            className="rounded-xl bg-white p-5 shadow-sm"
                                        >
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {product.name}
                                            </h2>

                                            <p className="mt-2 text-xl font-bold text-blue-600">
                                                ₱
                                                {Number(
                                                    product.selling_price
                                                ).toFixed(2)}
                                            </p>

                                            <p className="mt-2 text-sm text-gray-500">
                                                Available:{' '}
                                                {product.max_quantity}
                                            </p>

                                            {cartQuantity > 0 && (
                                                <p className="mt-1 text-sm font-medium text-blue-600">
                                                    In cart: {cartQuantity}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                                disabled={!canAdd}
                                                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                            >
                                                {!product.can_sell
                                                    ? 'Out of Stock'
                                                    : cartQuantity >=
                                                        product.max_quantity
                                                      ? 'Maximum Reached'
                                                      : 'Add to Cart'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cart */}
                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Cart
                                </h2>

                                <span className="text-sm text-gray-500">
                                    {cart.reduce(
                                        (total, item) =>
                                            total + item.quantity,
                                        0
                                    )}{' '}
                                    item(s)
                                </span>
                            </div>

                            {cart.length === 0 ? (
                                <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
                                    <p className="text-sm text-gray-500">
                                        Your cart is empty.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    {cart.map((item) => {
                                        const itemSubtotal =
                                            Number(item.selling_price) *
                                            item.quantity;

                                        return (
                                            <div
                                                key={item.id}
                                                className="border-b pb-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {item.name}
                                                        </h3>

                                                        <p className="text-sm text-gray-500">
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
                                                            removeFromCart(
                                                                item.id
                                                            )
                                                        }
                                                        className="text-sm text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex items-center rounded-lg border border-gray-300">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                decreaseQuantity(
                                                                    item.id
                                                                )
                                                            }
                                                            className="px-3 py-1.5 text-lg text-gray-700 hover:bg-gray-100"
                                                        >
                                                            −
                                                        </button>

                                                        <span className="min-w-10 px-2 text-center font-semibold">
                                                            {item.quantity}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                increaseQuantity(
                                                                    item.id
                                                                )
                                                            }
                                                            disabled={
                                                                item.quantity >=
                                                                item.max_quantity
                                                            }
                                                            className="px-3 py-1.5 text-lg text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <p className="font-semibold text-gray-900">
                                                        ₱
                                                        {itemSubtotal.toFixed(
                                                            2
                                                        )}
                                                    </p>
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

                                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                                            {/* Order Summary */}
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
                                            </div>

                                            {/* Payment Details */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    Payment Method
                                                </h3>

                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPaymentMethod('cash');
                                                            setAmountPaid('');
                                                            setPaymentReference('');
                                                        }}
                                                        className={`rounded-lg border px-4 py-3 font-semibold ${
                                                            paymentMethod === 'cash'
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 text-gray-700'
                                                        }`}
                                                    >
                                                        Cash
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPaymentMethod('gcash');
                                                            setAmountPaid(cartTotal.toFixed(2));
                                                        }}
                                                        className={`rounded-lg border px-4 py-3 font-semibold ${
                                                            paymentMethod === 'gcash'
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 text-gray-700'
                                                        }`}
                                                    >
                                                        GCash
                                                    </button>
                                                </div>

                                                {paymentMethod === 'cash' && (
                                                    <div className="mt-5">
                                                        <label
                                                            htmlFor="amount-paid"
                                                            className="mb-2 block text-sm font-medium text-gray-700"
                                                        >
                                                            Amount Paid
                                                        </label>

                                                        <input
                                                            id="amount-paid"
                                                            type="number"
                                                            min={cartTotal}
                                                            step="0.01"
                                                            value={amountPaid}
                                                            onChange={(event) =>
                                                                setAmountPaid(event.target.value)
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            placeholder="Enter amount received"
                                                        />

                                                        <div className="mt-4 flex justify-between rounded-lg bg-gray-50 px-4 py-3">
                                                            <span className="text-gray-600">
                                                                Change
                                                            </span>

                                                            <span className="font-bold text-gray-900">
                                                                ₱{change.toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {amountPaid !== '' &&
                                                            numericAmountPaid < cartTotal && (
                                                                <p className="mt-2 text-sm text-red-600">
                                                                    Amount paid must be at least ₱
                                                                    {cartTotal.toFixed(2)}.
                                                                </p>
                                                            )}
                                                    </div>
                                                )}

                                                {paymentMethod === 'gcash' && (
                                                    <div className="mt-5">
                                                        <label
                                                            htmlFor="payment-reference"
                                                            className="mb-2 block text-sm font-medium text-gray-700"
                                                        >
                                                            GCash Reference Number
                                                        </label>

                                                        <input
                                                            id="payment-reference"
                                                            type="text"
                                                            value={paymentReference}
                                                            onChange={(event) =>
                                                                setPaymentReference(
                                                                    event.target.value
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            placeholder="Enter GCash reference number"
                                                        />

                                                        <p className="mt-2 text-sm text-gray-500">
                                                            GCash payment must exactly match the total.
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={completeSale}
                                                    disabled={!paymentValid || submitting}
                                                    className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                >
                                                    {submitting ? 'Processing...' : 'Complete Sale'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                
                                    {/* Total */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                                            <span>Total</span>

                                            <span>
                                                ₱{cartTotal.toFixed(2)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={proceedToPayment}
                                            disabled={cart.length === 0 || showPayment}
                                            className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >
                                             {showPayment ? 'Payment in Progress' : 'Proceed to Payment'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="rounded-xl bg-white p-6 shadow-sm">

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
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Refresh
                                        </button>
                                    </div>

                                    {transactionsLoading ? (
                                        <div className="py-8 text-center text-sm text-gray-500">
                                            Loading transactions...
                                        </div>
                                    ) : transactionsError ? (
                                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                            {transactionsError}
                                        </div>
                                    ) : transactions.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-gray-500">
                                            No transactions yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b text-gray-500">
                                                        <th className="px-3 py-3 font-medium">
                                                            Transaction
                                                        </th>

                                                        <th className="px-3 py-3 font-medium">
                                                            Payment
                                                        </th>

                                                        <th className="px-3 py-3 font-medium text-right">
                                                            Total
                                                        </th>

                                                        <th className="px-3 py-3 font-medium text-right">
                                                            Date
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {transactions.map((transaction) => {
                                                        const payment =
                                                            transaction.payments?.[0];

                                                        return (
                                                            <tr
                                                                key={transaction.id}
                                                                className="border-b last:border-b-0"
                                                            >
                                                                <td className="px-3 py-3">
                                                                    <div className="font-medium text-gray-900">
                                                                        {transaction.sale_number}
                                                                    </div>

                                                                    <div className="text-xs text-gray-500">
                                                                        #{transaction.id}
                                                                    </div>
                                                                </td>

                                                                <td className="px-3 py-3">
                                                                    <div className="font-medium capitalize text-gray-900">
                                                                        {payment?.method ?? '-'}
                                                                    </div>

                                                                    {payment?.method === 'gcash' &&
                                                                        payment?.reference_number && (
                                                                            <div className="text-xs text-gray-500">
                                                                                Ref:{' '}
                                                                                {
                                                                                    payment.reference_number
                                                                                }
                                                                            </div>
                                                                        )}
                                                                </td>

                                                                <td className="px-3 py-3 text-right font-semibold text-gray-900">
                                                                    ₱
                                                                    {Number(
                                                                        transaction.total_amount
                                                                    ).toFixed(2)}
                                                                </td>

                                                                <td className="px-3 py-3 text-right text-gray-500">
                                                                    {new Date(
                                                                        transaction.created_at
                                                                    ).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                </div>
            </div>
        </AuthenticatedLayout>
    );
}