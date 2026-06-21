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

// ── Auth routes that handle their own error UI (suppress global toast) ───────
const SILENT_ERROR_URLS = ["/auth/login", "/auth/register", "/auth/refresh"];

// ── Response interceptor: silent refresh on 401 + global error toasts ────────
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

    // ── Global error toast for all other errors ─────────────────────────────
    // Skip: auth routes (they show inline errors), network errors with no
    // response (handled below), and already-retried requests.
    const url: string = original?.url ?? "";
    const isSilent = SILENT_ERROR_URLS.some((u) => url.includes(u));

    if (!isSilent) {
      if (error.response) {
        // Server responded with an error status
        const status: number = error.response.status;
        const serverMessage: string =
          error.response.data?.error?.message ??
          error.response.data?.message ??
          error.message;

        const titles: Record<number, string> = {
          400: "Bad request",
          403: "Access denied",
          404: "Not found",
          409: "Conflict",
          422: "Validation error",
          429: "Too many requests",
          500: "Server error",
          503: "Service unavailable",
        };

        toast.error(titles[status] ?? `Error ${status}`, {
          description: serverMessage,
        });
      } else if (error.request) {
        // Request was made but no response received (network issue)
        toast.error("Network error", {
          description: "Could not reach the server. Check your connection.",
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
