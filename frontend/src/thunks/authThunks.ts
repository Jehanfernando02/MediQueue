/**
 * Auth Thunks — all async auth operations
 *
 * Each thunk:
 *  1. Makes the API call (via axiosClient)
 *  2. Dispatches sync slice actions to update state
 *  3. Returns a typed result the component can use to navigate / show toasts
 *
 * Token persistence:
 *  access_token  → Redux state only (in-memory)
 *  refresh_token → localStorage (key: mediqueue.refresh_token)
 *
 * Import tree (no circular deps):
 *  authThunks → store/slices/authSlice (sync actions)
 *  authThunks → api/axiosClient
 *  authThunks → store/store (AppDispatch type)
 */

import axios from "axios";
import api, { API_BASE } from "@/api/axiosClient";
import {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  setTokens,
  clearAuth,
  setAuthIdle,
  type AuthUser,
  type Role,
} from "@/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

// ── Token helpers ─────────────────────────────────────────────────────────────

const REFRESH_KEY = "mediqueue.refresh_token";

export function saveRefreshToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(REFRESH_KEY, token);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function removeRefreshToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(REFRESH_KEY);
  }
}

// ── Error extraction ──────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.error?.message;
    if (detail) return detail;
    if (err.response?.status === 422) return "Invalid input. Please check your details.";
    if (err.response?.status === 409) return "An account with this email already exists.";
    if (err.response?.status === 401) return "Invalid email or password.";
    if (err.response?.status === 429) return "Too many requests. Please wait a moment.";
  }
  return "Something went wrong. Please try again.";
}

// ── User mapper ───────────────────────────────────────────────────────────────

function mapUser(u: { id: number; email: string; name: string; role: string }): AuthUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role as Role };
}

// ── Payload types ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: Role;
}

// ── Thunk return types ────────────────────────────────────────────────────────

export type AuthThunkResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

// ── loginThunk ────────────────────────────────────────────────────────────────

export const loginThunk =
  (credentials: LoginPayload) =>
  async (dispatch: AppDispatch): Promise<AuthThunkResult> => {
    dispatch(setAuthLoading());
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/v1/auth/login`,
        credentials,
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token, refresh_token, user } = data.data;
      const authUser = mapUser(user);

      saveRefreshToken(refresh_token);
      dispatch(setAuthSuccess({ user: authUser, accessToken: access_token }));

      return { success: true, user: authUser };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAuthError(message));
      return { success: false, error: message };
    }
  };

// ── registerThunk ─────────────────────────────────────────────────────────────

export const registerThunk =
  (payload: RegisterPayload) =>
  async (dispatch: AppDispatch): Promise<AuthThunkResult> => {
    dispatch(setAuthLoading());
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/v1/auth/register`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token, refresh_token, user } = data.data;
      const authUser = mapUser(user);

      saveRefreshToken(refresh_token);
      dispatch(setAuthSuccess({ user: authUser, accessToken: access_token }));

      return { success: true, user: authUser };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAuthError(message));
      return { success: false, error: message };
    }
  };

// ── logoutThunk ───────────────────────────────────────────────────────────────

export const logoutThunk =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    const refreshToken = getRefreshToken();
    const { accessToken } = getState().auth;

    if (refreshToken) {
      try {
        // Best-effort: tell the server to invalidate the refresh token
        await axios.post(
          `${API_BASE}/api/v1/auth/logout`,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );
      } catch {
        // Logout is always successful client-side even if request fails
      }
    }

    removeRefreshToken();
    dispatch(clearAuth());
    dispatch(setAuthIdle());
  };

// ── restoreSessionThunk ───────────────────────────────────────────────────────

/**
 * Called once on app boot (from __root.tsx SessionRestorer).
 * Reads the refresh token from localStorage, exchanges it for a new pair,
 * then fetches /auth/me to populate the Redux user state.
 * If anything fails, silently clears auth — the user will just see the login page.
 */
export const restoreSessionThunk =
  () =>
  async (dispatch: AppDispatch): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return;

    dispatch(setAuthLoading());
    try {
      // Exchange refresh token for new pair
      const { data: refreshData } = await axios.post(
        `${API_BASE}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccess: string = refreshData.data.access_token;
      const newRefresh: string = refreshData.data.refresh_token;

      // Persist the new refresh token (single-use rotation)
      saveRefreshToken(newRefresh);

      // Update axios interceptor's token source
      dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }));

      // Fetch user info with new access token
      const { data: meData } = await axios.get(
        `${API_BASE}/api/v1/auth/me`,
        { headers: { Authorization: `Bearer ${newAccess}` } }
      );

      const authUser = mapUser(meData.data);
      dispatch(setAuthSuccess({ user: authUser, accessToken: newAccess }));
    } catch {
      removeRefreshToken();
      dispatch(clearAuth());
    }
  };
