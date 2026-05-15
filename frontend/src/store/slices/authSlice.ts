/**
 * Auth Slice — pure state layer
 *
 * ONLY contains:
 *  - Types (Role, AuthUser, AuthState)
 *  - Initial state
 *  - Synchronous reducers (all state mutations live here)
 *  - Selectors
 *
 * NO thunks, NO API calls, NO imports from store.ts (avoids circular deps).
 * Selectors use a local `SliceState` shape instead of RootState so this
 * file stays fully independent.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Role = "patient" | "doctor" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called by thunks before an async auth operation starts */
    setAuthLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    /** Called by loginThunk / registerThunk / restoreSessionThunk on success */
    setAuthSuccess(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>
    ) {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },

    /** Called by thunks on error */
    setAuthError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    /**
     * Called by the axios interceptor when it silently refreshes tokens
     * (refresh_token stored in localStorage by thunks)
     */
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) {
      state.accessToken = action.payload.accessToken;
      // refreshToken is persisted in localStorage by the thunk/interceptor
    },

    /** Hard-clear all auth state — called by logoutThunk and axios interceptor */
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
    },

    /** Clear the error banner without touching other state */
    clearError(state) {
      state.error = null;
    },

    /** Thunk sets status back to idle after logout */
    setAuthIdle(state) {
      state.status = "idle";
    },
  },
});

export const {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  setTokens,
  clearAuth,
  clearError,
  setAuthIdle,
} = authSlice.actions;

export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────
// Using a local slice shape keeps this file free of RootState imports

type SliceState = { auth: AuthState };

export const selectAuthUser = (s: SliceState) => s.auth.user;
export const selectAuthStatus = (s: SliceState) => s.auth.status;
export const selectAuthError = (s: SliceState) => s.auth.error;
export const selectIsAuthenticated = (s: SliceState) => !!s.auth.user;
export const selectAccessToken = (s: SliceState) => s.auth.accessToken;
