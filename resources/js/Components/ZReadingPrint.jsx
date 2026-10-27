import React from 'react';

export default function ZReadingPrint({ reading, onClose }) {
    if (!reading) {
        return null;
    }

    const snapshot = reading.snapshot ?? {};
    const branch = snapshot.branch ?? {};
    const businessDay = snapshot.business_day ?? {};
    const generatedBy = snapshot.generated_by ?? {};

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(Number(amount ?? 0));

    const formatDateTime = (value) => {
        if (!value) return '-';

        return new Date(value).toLocaleString('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    const businessDate =
        snapshot.business_date ??
        reading.business_day?.business_date ??
        '-';

    const readingNumber =
        snapshot.reading_number ??
        reading.reading_number ??
        '-';

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-4">
            <div className="mx-auto max-w-2xl rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4 print:hidden">
                    <h2 className="text-lg font-bold text-gray-900">
                        Z-Reading
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>

                <div
                    id="z-reading-print"
                    className="z-reading-paper p-6 text-sm text-gray-900 sm:p-8"
                >
                    <header className="text-center">
                        <h1 className="text-2xl font-bold tracking-wide">
                            Z-READING
                        </h1>

                        <p className="mt-2 font-semibold">
                            {branch.name ?? reading.branch?.name ?? 'Branch'}
                        </p>

                        <p>Business Date: {businessDate}</p>
                        <p className="mt-1 font-semibold">
                            Reading No.: {readingNumber}
                        </p>
                    </header>

                    <hr className="my-5 border-dashed border-gray-400" />

                    <section>
                        <h3 className="mb-3 font-bold">BUSINESS DAY</h3>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Opened</span>
                            <span className="text-right">
                                {formatDateTime(businessDay.opened_at)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Closed</span>
                            <span className="text-right">
                                {formatDateTime(
                                    businessDay.closed_at ?? reading.generated_at
                                )}
                            </span>
                        </div>

                        {businessDay.is_recovery_close && (
                            <div className="mt-3 rounded border border-gray-300 p-3">
                                <p className="font-bold">RECOVERY CLOSE</p>
                                <p className="mt-1 whitespace-pre-wrap">
                                    {businessDay.recovery_reason ||
                                        'No recovery reason recorded.'}
                                </p>
                            </div>
                        )}
                    </section>

                    <hr className="my-5 border-dashed border-gray-400" />

                    <section>
                        <h3 className="mb-3 font-bold">SALES SUMMARY</h3>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Completed Transactions</span>
                            <span>{snapshot.sales_count ?? reading.sales_count ?? 0}</span>
                        </div>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Gross Sales</span>
                            <span>
                                {formatCurrency(snapshot.gross_sales_amount ?? reading.gross_sales_amount)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Voided Transactions</span>
                            <span>
                                {snapshot.voided_sales_count ?? reading.voided_sales_count ?? 0}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Voided Sales Amount</span>
                            <span>
                                {formatCurrency(snapshot.voided_sales_amount ?? reading.voided_sales_amount)}
                            </span>
                        </div>

                        <div className="mt-3 flex justify-between gap-4 border-t border-gray-400 pt-3 text-base font-bold">
                            <span>NET SALES</span>
                            <span>
                                {formatCurrency(snapshot.net_sales_amount ?? reading.net_sales_amount)}
                            </span>
                        </div>
                    </section>

                    <hr className="my-5 border-dashed border-gray-400" />

                    <section>
                        <h3 className="mb-3 font-bold">PAYMENT SUMMARY</h3>

                        <div className="flex justify-between gap-4 py-1">
                            <span>Cash</span>
                            <span>
                                {formatCurrency(snapshot.cash_sales_amount ?? reading.cash_sales_amount)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 py-1">
                            <span>GCash</span>
                            <span>
                                {formatCurrency(snapshot.gcash_sales_amount ?? reading.gcash_sales_amount)}
                            </span>
                        </div>
                    </section>

                    <hr className="my-5 border-dashed border-gray-400" />

                    <section>
                        <h3 className="mb-3 font-bold">TRANSACTION DETAILS</h3>

                        {(snapshot.sales ?? []).length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="py-2 pr-2">Sale No.</th>
                                            <th className="py-2 pr-2">Status</th>
                                            <th className="py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {snapshot.sales.map((sale, index) => (
                                            <tr
                                                key={sale.sale_id ?? index}
                                                className="border-b border-gray-100"
                                            >
                                                <td className="py-2 pr-2">
                                                    {sale.sale_number ?? sale.sale_id}
                                                </td>
                                                <td className="py-2 pr-2 uppercase">
                                                    {sale.status}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(sale.total_amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No transaction details were saved in this snapshot.</p>
                        )}
                    </section>

                    <footer className="mt-8 space-y-1 text-xs text-gray-600">
                        <p>
                            Generated by:{' '}
                            {[
                                generatedBy?.first_name ??
                                    reading.generated_by?.first_name,
                                generatedBy?.middle_name ??
                                    reading.generated_by?.middle_name,
                                generatedBy?.last_name ??
                                    reading.generated_by?.last_name,
                                generatedBy?.suffix ??
                                    reading.generated_by?.suffix,
                            ]
                                .filter(Boolean)
                                .join(' ') ||
                                generatedBy?.name ||
                                reading.generated_by?.name ||
                                'Unknown'}
                        </p>
                        <p>Generated at: {formatDateTime(reading.generated_at)}</p>
                        <p className="pt-4 text-center font-semibold text-gray-900">
                            END OF Z-READING
                        </p>
                    </footer>
                </div>

                <div className="flex justify-end border-t p-4 print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Print / Reprint
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        margin: 10mm;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #z-reading-print,
                    #z-reading-print * {
                        visibility: visible !important;
                    }

                    #z-reading-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        color: #000 !important;
                        background: #fff !important;
                    }

                    #z-reading-print .overflow-x-auto {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
}