/**
 * Centralized API Client for LoanPoint V3 Mobile
 * Connects React Native app to Pure Node.js REST API
 */

import { saveSecureItem, getSecureItem, deleteSecureItem, SECURE_KEYS } from './securityStorage';

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'https://loanpointapp.onrender.com/api/v1'
).replace(/\/+$/, '');

let authToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing: boolean = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Initialize tokens from hardware-backed SecureStore upon app launch
getSecureItem(SECURE_KEYS.AUTH_TOKEN).then((token) => {
  if (token) authToken = token;
});
getSecureItem(SECURE_KEYS.REFRESH_TOKEN).then((token) => {
  if (token) refreshToken = token;
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    saveSecureItem(SECURE_KEYS.AUTH_TOKEN, token);
  } else {
    deleteSecureItem(SECURE_KEYS.AUTH_TOKEN);
  }
};

export const getAuthToken = (): string | null => {
  return authToken;
};

export const setRefreshToken = (token: string | null) => {
  refreshToken = token;
  if (token) {
    saveSecureItem(SECURE_KEYS.REFRESH_TOKEN, token);
  } else {
    deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
  }
};

export const getRefreshToken = (): string | null => {
  return refreshToken;
};

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    // If Access Token is expired (401), attempt silent token refresh using Refresh Token
    if (res.status === 401 && refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/logout')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshRes.json().catch(() => ({}));
          if (refreshRes.ok && refreshData.token) {
            authToken = refreshData.token;
            if (refreshData.refreshToken) {
              refreshToken = refreshData.refreshToken;
            }
            isRefreshing = false;
            onRefreshed(authToken!);

            // Retry original request with newly refreshed token
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${authToken}`,
            };
            const retryRes = await fetch(url, {
              method,
              headers: retryHeaders,
              body: options.body ? JSON.stringify(options.body) : undefined,
            });
            const retryData = await retryRes.json().catch(() => ({}));
            if (!retryRes.ok) {
              throw new Error(retryData?.message || `Request failed with status ${retryRes.status}`);
            }
            return retryData;
          } else {
            isRefreshing = false;
            authToken = null;
            refreshToken = null;
          }
        } catch {
          isRefreshing = false;
          authToken = null;
          refreshToken = null;
        }
      } else {
        // Queue concurrent requests while refreshing
        return new Promise<ApiResponse<T>>((resolve, reject) => {
          addRefreshSubscriber(async (newToken: string) => {
            try {
              const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              };
              const retryRes = await fetch(url, {
                method,
                headers: retryHeaders,
                body: options.body ? JSON.stringify(options.body) : undefined,
              });
              const retryData = await retryRes.json().catch(() => ({}));
              if (!retryRes.ok) {
                reject(new Error(retryData?.message || `Request failed with status ${retryRes.status}`));
              } else {
                resolve(retryData);
              }
            } catch (retryErr) {
              reject(retryErr);
            }
          });
        });
      }
    }

    if (!res.ok) {
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err: any) {
    console.warn(`[API Client Error] ${method} ${endpoint}:`, err.message || err);
    throw err;
  }
}
