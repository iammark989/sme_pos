import { API_BASE_URL } from '../config/api';
import { getAuthToken } from './authService';

export interface ManagedUser {
  id: number;
  username: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  email: string;
  role_id: number;
  branch_id: number | null;
  is_global_admin: boolean;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
  } | null;
}

export interface UserFormData {
  username?: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  email: string;
  password?: string;
  role_id: number;
  branch_id?: number | null;
  is_global_admin?: boolean;
  is_active?: boolean;
}

export interface PaginatedUsers {
  data: ManagedUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse<T> {
  message?: string;
  data: T;
}

async function userRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: object,
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ?? 'Unable to complete the user management request.',
    );
  }

  return data as T;
}

export async function getUsers(
  page: number = 1,
): Promise<PaginatedUsers> {
  const response = await userRequest<ApiResponse<PaginatedUsers>>(
    `/users?page=${page}`,
  );

  return response.data;
}

export async function getUser(
  id: number,
): Promise<ManagedUser> {
  const response = await userRequest<ApiResponse<ManagedUser>>(
    `/users/${id}`,
  );

  return response.data;
}

export async function createUser(
  payload: UserFormData,
): Promise<ManagedUser> {
  const response = await userRequest<ApiResponse<ManagedUser>>(
    '/users',
    'POST',
    payload,
  );

  return response.data;
}

export async function updateUser(
  id: number,
  payload: Partial<UserFormData>,
): Promise<ManagedUser> {
  const response = await userRequest<ApiResponse<ManagedUser>>(
    `/users/${id}`,
    'PUT',
    payload,
  );

  return response.data;
}

export async function deactivateUser(
  id: number,
): Promise<ManagedUser> {
  const response = await userRequest<ApiResponse<ManagedUser>>(
    `/users/${id}`,
    'DELETE',
  );

  return response.data;
}