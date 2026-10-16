import type { CartItem } from '../screens/PosScreen';
import type { PaymentMethod, SaleResponse } from './saleService';

export interface ReceiptFormatRequest {
  saleData: SaleResponse['data'];
  items: CartItem[];
  payment: {
    method: PaymentMethod;
    amountPaid: number;
    paymentReference?: string;
  };
  storeName?: string;
  paperWidth?: 58 | 80;
}

const formatMoney = (amount: number): string =>
  `PHP ${amount.toFixed(2)}`;

const centerText = (text: string, width: number): string => {
  const value = text.slice(0, width);
  const leftPadding = Math.max(
    0,
    Math.floor((width - value.length) / 2),
  );

  return `${' '.repeat(leftPadding)}${value}`;
};

const separator = (width: number): string => '-'.repeat(width);

const formatItemLine = (
  name: string,
  quantity: number,
  unitPrice: number,
  width: number,
): string[] => {
  const lines: string[] = [];
  const priceText = formatMoney(quantity * unitPrice);
  const availableNameWidth = Math.max(
    10,
    width - priceText.length - 1,
  );

  // Wrap long product names instead of silently cutting them off.
  const words = name.split(/\s+/).filter(Boolean);
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (
      candidate.length > availableNameWidth &&
      currentLine.length > 0
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    lines.push('Unnamed item');
  }

  lines.push(
    `${quantity} x ${formatMoney(unitPrice)}`,
  );

  const lastLine = lines[lines.length - 1];
  const itemNameLines = lines.slice(0, -1);

  // Keep the item's extended price aligned to the right.
  const firstNameLine = itemNameLines[0] ?? '';
  const remainingNameLines = itemNameLines.slice(1);
  const nameWidth = Math.max(
    1,
    width - priceText.length - 1,
  );

  const result = [
    `${firstNameLine.slice(0, nameWidth).padEnd(nameWidth)} ${priceText}`,
    ...remainingNameLines,
    lastLine,
  ];

  return result;
};

export function formatReceipt(
  request: ReceiptFormatRequest,
): string {
  const { saleData, items, payment } = request;
  const width = request.paperWidth === 58 ? 32 : 42;
  const storeName = request.storeName?.trim() || 'SME POS';

  const sale = saleData.sale;
  const total = Number(sale.total_amount);
  const subtotal = Number(sale.subtotal);
  const discount = Number(sale.discount_amount);
  const change = Number(saleData.change_amount);

  const lines: string[] = [];

  lines.push(centerText(storeName, width));
  lines.push(centerText('SALES RECEIPT', width));
  lines.push(separator(width));
  lines.push(`Receipt: ${sale.sale_number}`);
  lines.push(`Status: ${sale.status.toUpperCase()}`);
  lines.push(separator(width));
  lines.push('ITEMS');

  for (const item of items) {
    lines.push(
      ...formatItemLine(
        item.product.name,
        item.quantity,
        Number(item.product.selling_price),
        width,
      ),
    );
    lines.push('');
  }

  lines.push(separator(width));
  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  lines.push(`Discount: ${formatMoney(discount)}`);
  lines.push(`TOTAL:    ${formatMoney(total)}`);
  lines.push(separator(width));
  lines.push(`Payment: ${payment.method.toUpperCase()}`);
  lines.push(`Paid: ${formatMoney(payment.amountPaid)}`);

  if (
    payment.method === 'gcash' &&
    payment.paymentReference
  ) {
    lines.push(`GCash Ref: ${payment.paymentReference}`);
  }

  if (payment.method === 'cash') {
    lines.push(`Change: ${formatMoney(change)}`);
  }

  lines.push(separator(width));
  lines.push(centerText('Thank you for your purchase!', width));
  lines.push('');
  lines.push('');

  return lines.join('\n');
}