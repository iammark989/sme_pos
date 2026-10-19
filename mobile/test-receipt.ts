
import {
  formatReceipt,
  type ReceiptFormatRequest,
} from './src/services/receiptFormatter';

const cashTest = {
  saleData: {
    sale: {
      id: 1,
      sale_number: 'SALE-TEST-001',
      status: 'completed',
      subtotal: '198.00',
      discount_amount: '0.00',
      total_amount: '198.00',
    },
    change_amount: 2,
  },
  items: [
    {
      product: {
        id: 1,
        name: 'Regular Fries',
        selling_price: 99,
      },
      quantity: 2,
    },
  ],
  payment: {
    method: 'cash',
    amountPaid: 200,
  },
  storeName: 'SME POS TEST STORE',
  paperWidth: 58,
} as unknown as ReceiptFormatRequest;

console.log('--- CASH RECEIPT ---');
console.log(formatReceipt(cashTest));

const gcashTest = {
  ...cashTest,
  saleData: {
    sale: {
      id: 2,
      sale_number: 'SALE-TEST-002',
      status: 'completed',
      subtotal: '150.00',
      discount_amount: '0.00',
      total_amount: '150.00',
    },
    change_amount: 0,
  },
  items: [
    {
      product: {
        id: 2,
        name: 'Cheese Fries with Extra Cheese',
        selling_price: 150,
      },
      quantity: 1,
    },
  ],
  payment: {
    method: 'gcash',
    amountPaid: 150,
    paymentReference: 'GCASH-TEST-12345',
  },
} as unknown as ReceiptFormatRequest;

console.log('\n--- GCASH RECEIPT ---');
console.log(formatReceipt(gcashTest));
