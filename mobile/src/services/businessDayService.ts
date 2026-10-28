import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface BusinessDay {
  id: number;
  branch_id: number;
  business_date: string;
  status: 'open' | 'closed' | string;
  opened_at?: string | null;
  closed_at?: string | null;
  is_recovery_close?: boolean;
  recovery_reason?: string | null;
}

export interface ZReading {
  id: number;
  business_day_id: number;
  branch_id: number;
  z_counter: number;
  reading_number: string;
  generated_by: number;
  generated_at: string;
  sales_count: number;
  voided_sales_count: number;
  gross_sales_amount: number | string;
  voided_sales_amount: number | string;
  net_sales_amount: number | string;
  cash_sales_amount: number | string;
  gcash_sales_amount: number | string;
  snapshot?: {
    reading_number?: string;
    business_date?: string;
    branch?: {
      id: number;
      name: string;
    };
    business_day?: {
      opened_at?: string | null;
      closed_at?: string | null;
      is_recovery_close?: boolean;
      recovery_reason?: string | null;
    };
    generated_by?: {
      id: number;
      name: string;
    };
    sales_count?: number;
    voided_sales_count?: number;
    gross_sales_amount?: number;
    voided_sales_amount?: number;
    net_sales_amount?: number;
    cash_sales_amount?: number;
    gcash_sales_amount?: number;
    sales?: Array<{
      sale_id: number;
      sale_number: string;
      status: string;
      total_amount: number;
      payments: Array<{
        method: string;
        amount: number;
      }>;
    }>;
  } | null;
  businessDay?: BusinessDay | null;
  branch?: {
    id: number;
    name: string;
  } | null;
  generatedBy?: {
    id: number;
    name: string;
  } | null;
}

export interface CurrentBusinessDayResponse {
  branch_id: number;
  business_day: BusinessDay | null;
  latest_z_reading: ZReading | null;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function getAuthenticatedHeaders(
  includeJsonContentType = false,
): Promise<Record<string, string>> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  return {
    Accept: 'application/json',
    ...(includeJsonContentType
      ? { 'Content-Type': 'application/json' }
      : {}),
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    const validationErrors = errorData.errors
      ? Object.values(errorData.errors).flat().join('\n')
      : '';

    throw new Error(
      validationErrors ||
        errorData.message ||
        'Unable to complete the business-day request.',
    );
  }

  return data as T;
}

/**
 * Gets the open business day and latest saved Z-Reading.
 *
 * branchId is optional for users with global access.
 * The backend determines the default branch when it is omitted.
 */
export async function getCurrentBusinessDay(
  branchId?: number,
): Promise<CurrentBusinessDayResponse> {
  const headers = await getAuthenticatedHeaders();
  const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';

  return parseResponse<CurrentBusinessDayResponse>(
    await fetch(`${API_BASE_URL}/business-days/current${query}`, {
      method: 'GET',
      headers,
    }),
  );
}

/**
 * Opens a business day for the authenticated user's branch.
 */
export async function openBusinessDay(): Promise<BusinessDay> {
  const headers = await getAuthenticatedHeaders(true);

  const data = await parseResponse<{
    message: string;
    business_day: BusinessDay;
  }>(
    await fetch(`${API_BASE_URL}/business-days/open`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    }),
  );

  return data.business_day;
}

/**
 * Closes the business day and generates its final Z-Reading.
 * A recovery reason is required by the backend for overdue closures.
 */
export async function closeBusinessDay(
  recoveryReason?: string,
): Promise<ZReading> {
  const headers = await getAuthenticatedHeaders(true);

  const data = await parseResponse<{
    message: string;
    z_reading: ZReading;
  }>(
    await fetch(`${API_BASE_URL}/business-days/z-reading/close`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recovery_reason: recoveryReason?.trim() || null,
      }),
    }),
  );

  return data.z_reading;
}

/**
 * Retrieves an existing saved Z-Reading.
 * Laravel checks that the reading belongs to the authenticated user's branch.
 */
export async function getSavedZReading(
  readingId: number,
): Promise<ZReading> {
  if (!Number.isInteger(readingId) || readingId <= 0) {
    throw new Error('Invalid Z-Reading ID.');
  }

  const headers = await getAuthenticatedHeaders();

  const data = await parseResponse<{ z_reading: ZReading }>(
    await fetch(
      `${API_BASE_URL}/z-readings/${encodeURIComponent(readingId)}`,
      {
        method: 'GET',
        headers,
      },
    ),
  );

  return data.z_reading;
}