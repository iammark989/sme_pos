import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface DailyReportParams {
  date: string; // YYYY-MM-DD
  branch_id: number;
}

export interface ReportBusinessDayStatus {
  date: string;
  branch_id: number;
  business_day_exists: boolean;
  message?: string | null;
}

export interface XReading {
  id: number;
  reading_number: string;
  shift_id: number;
  user_id: number;
  cashier: string | null;
  warehouse_id: number;
  warehouse: string | null;
  opened_at: string | null;
  closed_at: string | null;
  cash_transaction_count: number;
  cash_sales_total: number;
  gcash_transaction_count: number;
  gcash_sales_total: number;
  void_transaction_count: number;
  void_sales_total: number;
  opening_cash: number;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
}

export interface XReadingReport extends ReportBusinessDayStatus {
  business_day_id?: number;
  summary?: {
    shift_count: number;
    cash_transaction_count: number;
    cash_sales_total: number;
    gcash_transaction_count: number;
    gcash_sales_total: number;
    void_transaction_count: number;
    void_sales_total: number;
    opening_cash: number;
    expected_cash: number;
    actual_cash: number;
    cash_variance: number;
  };
  x_readings: XReading[];
}

export interface ZReading {
  id: number;
  reading_number: string;
  z_counter: number;
  generated_at: string;
  sales_count: number;
  voided_sales_count: number;
  gross_sales_amount: string | number;
  voided_sales_amount: string | number;
  net_sales_amount: string | number;
  cash_sales_amount: string | number;
  gcash_sales_amount: string | number;
}

export interface ZReadingReport extends ReportBusinessDayStatus {
  business_day_status?: string;
  z_reading: ZReading | null;
}

export interface ProductSalesItem {
  product_id: number;
  product_name: string;
  sku: string | null;
  quantity_sold: number;
  gross_sales: number;
}

export interface ProductSalesReport extends ReportBusinessDayStatus {
  business_day_id?: number;
  products: ProductSalesItem[];
}

async function getReport<T>(
  endpoint: string,
  params: DailyReportParams,
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const query = new URLSearchParams({
    date: params.date,
    branch_id: String(params.branch_id),
  });

  const response = await fetch(
    `${API_BASE_URL}${endpoint}?${query.toString()}`,
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
    throw new Error(data.message ?? 'Unable to load the report.');
  }

  return data.data as T;
}

export function getDailyXReadingReport(
  params: DailyReportParams,
): Promise<XReadingReport> {
  return getReport<XReadingReport>(
    '/reports/x-reading/daily',
    params,
  );
}

export function getDailyZReadingReport(
  params: DailyReportParams,
): Promise<ZReadingReport> {
  return getReport<ZReadingReport>(
    '/reports/z-reading/daily',
    params,
  );
}

export function getDailyProductSalesReport(
  params: DailyReportParams,
): Promise<ProductSalesReport> {
  return getReport<ProductSalesReport>(
    '/reports/sales/daily/products',
    params,
  );
}