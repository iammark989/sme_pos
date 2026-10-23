import {
  CODEPAGE,
  EscPosBuilder,
  isConnected,
  printBytes,
} from '@ricka7x/expo-thermal-printer';

import type { ShiftReading } from './posService';

export interface ShiftReadingPrintResult {
  success: boolean;
  message: string;
}

const formatMoney = (value: string | number): string =>
  `PHP ${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string): string => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-PH');
};

const formatRow = (label: string, value: string): string =>
  `${label}: ${value}`;

export async function printShiftReading(
  reading: ShiftReading,
): Promise<ShiftReadingPrintResult> {
  try {
    if (!isConnected()) {
      return {
        success: false,
        message:
          'No thermal printer is connected. Open Printer Setup, connect your printer, and retry printing the X-reading.',
      };
    }

    const lines = [
      '          SME POS',
      '      SHIFT X-READING',
      '================================',
      formatRow('Reading No.', reading.reading_number),
      formatRow('Shift ID', String(reading.shift_id)),
      formatRow('Generated', formatDate(reading.generated_at)),
      '--------------------------------',
      'SALES SUMMARY',
      '--------------------------------',
      formatRow(
        `Cash Sales (${reading.cash_transaction_count})`,
        formatMoney(reading.cash_sales_total),
      ),
      formatRow(
        `GCash Sales (${reading.gcash_transaction_count})`,
        formatMoney(reading.gcash_sales_total),
      ),
      formatRow(
        `Voided (${reading.void_transaction_count})`,
        formatMoney(reading.void_sales_total),
      ),
      '--------------------------------',
      'CASH RECONCILIATION',
      '--------------------------------',
      formatRow('Opening Cash', formatMoney(reading.opening_cash)),
      formatRow('Expected Cash', formatMoney(reading.expected_cash)),
      formatRow('Actual Cash', formatMoney(reading.actual_cash)),
      formatRow('Variance', formatMoney(reading.cash_variance)),
      '--------------------------------',
      formatRow('Shift Opened', formatDate(reading.opened_at)),
      formatRow('Shift Closed', formatDate(reading.closed_at)),
      '================================',
      '     END OF SHIFT X-READING',
      '      Retain for your records',
    ];

    const builder = new EscPosBuilder()
      .init()
      .codepage(CODEPAGE.CP850)
      .align('left');

    for (const line of lines) {
      builder.line(line);
    }

    const receiptBytes = builder.feed(3).build();

    await printBytes(receiptBytes);

    return {
      success: true,
      message:
        'The X-reading was sent to the thermal printer. Please check the printed output.',
    };
  } catch (error) {
    console.error('X-reading printing failed:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unable to print the X-reading. The saved reading remains available for retry.',
    };
  }
}