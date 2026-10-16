import type { CartItem } from '../screens/PosScreen';
import type { PaymentMethod, SaleResponse } from './saleService';

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
  _request: ReceiptPrintRequest,
): Promise<ReceiptPrintResult> {
  return {
    success: false,
    message:
      'No thermal printer is configured yet. Your sale is saved, and the on-screen receipt is still available.',
  };
}