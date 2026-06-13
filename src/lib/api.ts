import axios from "axios";
import { toast } from "sonner";
import { getRouter } from "../router";

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}

// Update the base URL if needed.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving the HttpOnly Refresh Token
});

// Store the access token securely in a closure instead of global axios defaults
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const prefetchToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF"] = csrfToken;
    }

    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers }
    );

    setAccessToken(data.access_token);
    processQueue(null, data.access_token);
    return data.access_token;
  } catch (refreshError) {
    processQueue(refreshError, null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

// Robust CSRF token extraction
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
  return match ? match.split('=')[1] : null;
};

// We need to keep track of whether we are currently refreshing the token
// so we don't spam the /auth/refresh endpoint on simultaneous 401s.
let isRefreshing = false;
let failedQueue: {
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Request Interceptor ---
api.interceptors.request.use((config) => {
  // To protect against CSRF attacks, the backend sets a standard `csrf_token` cookie.
  // We extract it and send it as the X-CSRF-Token header.
  const csrfToken = getCsrfToken();
  if (csrfToken && config.headers) {
    config.headers["X-CSRF"] = csrfToken;
  }

  // Inject the access token from our closure
  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return config;
});

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 Unauthorized and we haven't already retried this exact request,
    // AND it hasn't explicitly opted out of auth refresh (like login routes)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      if (isRefreshing) {
        // If a refresh is already in progress, wait for it to finish!
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We use raw axios here to avoid infinite loops with the interceptors,
        // but we must manually extract and attach the CSRF token!
        const headers: Record<string, string> = {};
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          headers["X-CSRF"] = csrfToken;
        }

        // Silently request a new access token using the HttpOnly Refresh Token cookie
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true, headers }
        );

        // Save the new token in our closure
        setAccessToken(data.access_token);
        originalRequest.headers["Authorization"] = `Bearer ${data.access_token}`;

        // Process any other requests that were waiting for this token
        processQueue(null, data.access_token);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If the refresh completely fails, their session is dead.
        // We dispatch an event so AuthContext can cleanly log them out.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          getRouter().navigate({ to: '/login' });
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global error handling for toasts
    if (error.response) {
      const status = error.response.status;
      if (status >= 500) {
        toast.error("An unexpected server error occurred.");
      }
      // 4xx errors are now intentionally left for the components to handle locally
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);
