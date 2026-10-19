import type { CartItem } from '../screens/PosScreen';
import type { PaymentMethod, SaleResponse } from './saleService';
import { formatReceipt } from './receiptFormatter';

import {
  CODEPAGE,
  EscPosBuilder,
  isConnected,
  printBytes,
} from '@ricka7x/expo-thermal-printer';

export interface ReceiptPrintRequest {
  saleData: SaleResponse['data'];
  items: CartItem[];
  payment: {
    method: PaymentMethod;
    amountPaid: number;
    paymentReference?: string;
  };
}

export interface ReceiptPrintResult {
  success: boolean;
  message: string;
}

export async function printReceipt(
  request: ReceiptPrintRequest,
): Promise<ReceiptPrintResult> {
  try {
    if (!isConnected()) {
      return {
        success: false,
        message:
          'No thermal printer is connected. Open Printer Setup, connect your printer, and try again.',
      };
    }

    const receiptText = formatReceipt({
      ...request,
      paperWidth: 58,
    });

    if (!receiptText.trim()) {
      throw new Error('The receipt content is empty.');
    }

    const builder = new EscPosBuilder()
      .init()
      .codepage(CODEPAGE.CP850)
      .align('left');

    for (const line of receiptText.split(/\r?\n/)) {
      builder.line(line);
    }

    const receiptBytes = builder
      .feed(3)
      .build();

    await printBytes(receiptBytes);

    return {
      success: true,
      message:
        'The receipt was sent to the thermal printer. Please check the printed output.',
    };
  } catch (error) {
    console.error('Thermal receipt printing failed:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unable to print the receipt. Your completed sale remains saved; you can retry printing.',
    };
  }
}