import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface InventoryTransaction {
  id: number;
  inventory_item_id: number;
  warehouse_id: number;
  type: string;
  transaction_category: string;
  quantity: string | number;
  created_at: string;
  notes: string | null;
  transfer_reference?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;

  inventory_item: {
    id: number;
    name: string;
    sku: string | null;
    uom?: {
      id: number;
      name: string;
      abbreviation?: string | null;
      symbol?: string | null;
    } | null;
  } | null;

  warehouse: {
    id: number;
    name: string;
    branch?: {
      id: number;
      name: string;
    } | null;
  } | null;

  related_warehouse?: {
    id: number;
    name: string;
  } | null;
}

export interface InventoryTransactionSummary {
  total_transactions: number;
  stock_in_count: number | null;
  stock_in_quantity: string | number;
  sale_count: number | null;
  sale_quantity: string | number;
  sale_reversal_count: number | null;
  sale_reversal_quantity: string | number;
  adjustment_count: number | null;
  adjustment_quantity: string | number;
  transfer_in_count: number | null;
  transfer_in_quantity: string | number;
  transfer_out_count: number | null;
  transfer_out_quantity: string | number;
}

export interface InventoryTransactionFilters {
  search?: string;
  branch_id?: number;
  warehouse_id?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedInventoryTransactions {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: InventoryTransaction[];
}

export interface InventoryTransactionsResponse {
  summary: InventoryTransactionSummary;
  data: PaginatedInventoryTransactions;
}

export async function getInventoryTransactions(
  filters: InventoryTransactionFilters = {},
): Promise<InventoryTransactionsResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const query = new URLSearchParams();

  if (filters.search?.trim()) {
    query.set('search', filters.search.trim());
  }

  if (filters.branch_id !== undefined) {
    query.set('branch_id', String(filters.branch_id));
  }

  if (filters.warehouse_id !== undefined) {
    query.set('warehouse_id', String(filters.warehouse_id));
  }

  if (filters.type) {
    query.set('type', filters.type);
  }

  if (filters.date_from) {
    query.set('date_from', filters.date_from);
  }

  if (filters.date_to) {
    query.set('date_to', filters.date_to);
  }

  query.set('page', String(filters.page ?? 1));
  query.set('per_page', String(filters.per_page ?? 20));

  const response = await fetch(
    `${API_BASE_URL}/inventory/transactions?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? 'Unable to load inventory transactions.',
    );
  }

  return result as InventoryTransactionsResponse;
}