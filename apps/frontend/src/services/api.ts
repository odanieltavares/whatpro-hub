import axios, { type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { tokenStorage } from '@/utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Silent refresh state ────────────────────────────────────────────────────
// isRefreshing prevents multiple parallel refresh calls
let isRefreshing = false;
// failedQueue holds requests that arrived while a refresh was in progress
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Request interceptor: attach Bearer token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: silent refresh on 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 errors that haven't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefreshToken();

      // No refresh token — redirect immediately
      if (!refreshToken) {
        toast.error('Sessão expirada. Faça login novamente.');
        tokenStorage.clearAll();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        });
      }

      // Mark as retried to avoid infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<{ success: boolean; data: { access_token: string } }>(
          '/auth/refresh',
          { refresh_token: refreshToken }
        );

        const newToken = response.data?.data?.access_token;
        if (!newToken) throw new Error('No token in refresh response');

        tokenStorage.setToken(newToken);
        processQueue(null, newToken);

        // Retry original request with new token
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        toast.error('Sessão expirada. Faça login novamente.');
        tokenStorage.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
