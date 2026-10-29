import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

export interface AuthUser {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
  } | null;
}

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'sme_pos_auth_token';

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to sign in.');
  }

  await SecureStore.setItemAsync(TOKEN_KEY, data.token);

  return data as LoginResponse;
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function logout(): Promise<void> {
  const token = await getAuthToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }
}


export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        return null;
      }

      throw new Error('Unable to verify your login session.');
    }

    const data = await response.json();

    return data.user as AuthUser;
  } catch (error) {
    if (error instanceof Error &&
        error.message === 'Unable to verify your login session.') {
      throw error;
    }

    throw new Error('Cannot connect to the server to verify your session.');
  }
}
export interface AuthUser {
  id: number;
  username: string;
  name?: string;
  email?: string;
  is_global_admin?: boolean;
  role?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
  } | null;
}
