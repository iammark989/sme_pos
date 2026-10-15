
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface PosShift {
  id: number;
  status: string;
  branch?: {
    id: number;
    name: string;
  } | null;
  warehouse?: {
    id: number;
    name: string;
  } | null;
}

export interface PosProduct {
  id: number;
  name: string;
  sku?: string | null;
  price: string | number;
  category?: {
    id: number;
    name: string;
  } | null;
  max_quantity: number;
  can_sell: boolean;
}

interface PosProductsResponse {
  data: {
    shift: PosShift;
    products: PosProduct[];
  };
}

export async function getPosProducts(): Promise<PosProductsResponse['data']> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/pos/products`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ?? 'Unable to load POS products.',
    );
  }

  return data.data as PosProductsResponse['data'];
}
