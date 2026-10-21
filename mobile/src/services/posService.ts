
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
 selling_price: string | number;
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


export interface PosShiftSummary {
  cash: {
    transaction_count: number;
    total_amount: number;
  };
  gcash: {
    transaction_count: number;
    total_amount: number;
  };
  voids: {
    transaction_count: number;
    total_amount: number;
  };
}

export interface CurrentShiftResponse {
  shift: PosShift & {
    opening_cash: string | number;
    expected_cash: string | number;
    actual_cash?: string | number | null;
    cash_variance?: string | number | null;
    opened_at?: string | null;
    closed_at?: string | null;
    opening_notes?: string | null;
    closing_notes?: string | null;
  } | null;
  summary?: PosShiftSummary;
}

export interface CloseShiftRequest {
  actual_cash: number;
  closing_notes?: string;
}

export interface ClosedShift {
  id: number;
  status: string;
  opening_cash: string | number;
  expected_cash: string | number;
  actual_cash: string | number;
  cash_variance: string | number;
  opened_at?: string | null;
  closed_at?: string | null;
  closing_notes?: string | null;
}

interface CurrentShiftApiResponse {
  data: CurrentShiftResponse;
}

interface CloseShiftApiResponse {
  message: string;
  data: {
    shift: ClosedShift;
  };
}

export async function getCurrentShift(): Promise<CurrentShiftResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/shifts/current`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load the current shift.');
  }

  return data.data as CurrentShiftResponse;
}

export async function closePosShift(
  request: CloseShiftRequest,
): Promise<CloseShiftApiResponse['data']['shift']> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/shifts/close`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join('\n')
      : '';

    throw new Error(
      validationErrors || data.message || 'Unable to close the shift.',
    );
  }

  return data.data.shift as ClosedShift;
}

