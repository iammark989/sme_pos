
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
