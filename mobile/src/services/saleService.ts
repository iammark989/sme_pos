
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export type PaymentMethod = 'cash' | 'gcash';

export interface SaleRequest {
  warehouse_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
  payment_method: PaymentMethod;
  amount_paid: number;
  payment_reference?: string;
}

export interface CompletedSale {
  id: number;
  sale_number: string;
  status: string;
  subtotal: string | number;
  discount_amount: string | number;
  total_amount: string | number;
}

export interface SaleResponse {
  message: string;
  data: {
    sale: CompletedSale;
    change_amount: number;
  };
}

export async function createSale(
  saleRequest: SaleRequest,
): Promise<SaleResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/sales`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(saleRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join('\n')
      : '';

    throw new Error(
      validationErrors || data.message || 'Unable to complete the sale.',
    );
  }

  return data as SaleResponse;
}

export interface SaleTransaction {
  id: number;
  branch_id: number;
  warehouse_id: number;
  user_id: number;
  shift_id: number;
  sale_number: string;
  status: string;
  subtotal: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  created_at: string;
  payments?: SalePayment[];
}

export interface SalePayment {
  id: number;
  sale_id: number;
  method: PaymentMethod;
  amount: string | number;
  reference_number?: string | null;
  notes?: string | null;
}

export interface HistoricalSaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: string | number;
  unit_price: string | number;
  discount_amount: string | number;
  subtotal: string | number;
  product?: {
    id: number;
    name: string;
    sku?: string | null;
  } | null;
}

export interface SaleTransactionDetail extends SaleTransaction {
  items: HistoricalSaleItem[];
  payments: SalePayment[];
  warehouse?: { id: number; name: string } | null;
  branch?: { id: number; name: string } | null;
  user?: { id: number; name: string } | null;
  shift?: { id: number; status: string } | null;
}

export async function getSaleTransactions(): Promise<SaleTransaction[]> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/pos/transactions`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load sales transactions.');
  }

  return data.data as SaleTransaction[];
}

export async function getSaleTransaction(
  saleId: number,
): Promise<SaleTransactionDetail> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(
    `${API_BASE_URL}/pos/transactions/${saleId}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load transaction details.');
  }

  return data.data as SaleTransactionDetail;
}
