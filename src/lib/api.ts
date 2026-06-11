import axios from "axios";
import { toast } from "sonner";

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

// We need to keep track of whether we are currently refreshing the token
// so we don't spam the /auth/refresh endpoint on simultaneous 401s.
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
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
  if (typeof document !== 'undefined') {
    const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
    if (csrfMatch && csrfMatch[1] && config.headers) {
      config.headers["X-CSRF"] = csrfMatch[1];
    }
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
        if (typeof document !== 'undefined') {
          const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
          if (csrfMatch && csrfMatch[1]) {
            headers["X-CSRF"] = csrfMatch[1];
          }
        }

        // Silently request a new access token using the HttpOnly Refresh Token cookie
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true, headers }
        );

        // Save the new token in Axios memory
        api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
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
