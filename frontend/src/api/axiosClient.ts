/**
 * Axios client for MediQueue API.
 *
 * - Base URL read from VITE_API_URL env var (falls back to http://localhost:8000)
 * - Attaches `Authorization: Bearer <access_token>` on every request
 * - On 401 → silently refreshes the token pair via /auth/refresh,
 *   retries the original request once, then dispatches logout if that fails too.
 *
 * Token storage strategy:
 *   access_token  → Redux state only (in-memory) — cleared on page reload
 *   refresh_token → localStorage — survives reload, used to restore session
 */

import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { store } from "@/store/store";
import { setTokens, clearAuth } from "@/store/slices/authSlice";
import { toast } from "sonner";

export const API_BASE: string =
  import.meta.env?.VITE_API_URL ?? "http://localhost:8000";


const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request interceptor: inject access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken;
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// ── Track if a token refresh is already in flight ────────────────────────────
let isRefreshing = false;
let waitQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  waitQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  waitQueue = [];
}

// ── Response interceptor: silent refresh on 401 ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("mediqueue.refresh_token")
          : null;

      if (!refreshToken) {
        store.dispatch(clearAuth());
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          waitQueue.push({
            resolve: (token) => {
              if (original.headers)
                original.headers["Authorization"] = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccess: string = data.data.access_token;
        const newRefresh: string = data.data.refresh_token;

        store.dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }));
        
        // Persist the new refresh token for the next session
        if (typeof window !== "undefined") {
          localStorage.setItem("mediqueue.refresh_token", newRefresh);
        }

        processQueue(null, newAccess);

        if (original.headers)
          original.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
