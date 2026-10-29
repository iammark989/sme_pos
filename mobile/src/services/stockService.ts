import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface StockInventoryItem {
  id: number;
  name: string;
  sku: string | null;
  reorder_level: string | number;
  uom?: {
    id: number;
    name: string;
    abbreviation?: string | null;
    symbol?: string | null;
  } | null;
}

export interface StockWarehouse {
  id: number;
  name: string;
  branch?: {
    id: number;
    name: string;
  } | null;
}

export interface Stock {
  id: number;
  warehouse_id: number;
  inventory_item_id: number;
  quantity: string | number;
  is_low_stock: boolean;
  inventoryItem: StockInventoryItem;
  warehouse: StockWarehouse;
}

export interface StockFilters {
  search?: string;
  warehouse_id?: number;
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedStocks {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: Stock[];
}

interface StockResponse {
  data: PaginatedStocks;
}

export async function getStocks(
  filters: StockFilters = {},
): Promise<PaginatedStocks> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const query = new URLSearchParams();

  if (filters.search?.trim()) {
    query.set('search', filters.search.trim());
  }

  if (filters.warehouse_id !== undefined) {
    query.set('warehouse_id', String(filters.warehouse_id));
  }

  if (filters.low_stock) {
    query.set('low_stock', '1');
  }

  query.set('page', String(filters.page ?? 1));
  query.set('per_page', String(filters.per_page ?? 20));

  const response = await fetch(
    `${API_BASE_URL}/inventory/stocks?${query.toString()}`,
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
      result.message ?? 'Unable to load inventory stocks.',
    );
  }

  return (result as StockResponse).data;
}