import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface Branch {
  id: number;
  name: string;
  code: string | null;
}

interface BranchResponse {
  data: Branch[];
}

export async function getBranches(): Promise<Branch[]> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/branches`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load branches.');
  }

  return (data as BranchResponse).data;
}