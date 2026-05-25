/**
 * lib/auth.tsx — Auth bridge
 *
 * Keeps the AuthProvider / useAuth surface that all route layouts use.
 * State is sourced ENTIRELY from Redux (store/slices/authSlice).
 *
 * The old `shimUser` useState has been removed — it created a race condition
 * where Redux state and the shim were briefly out of sync during login,
 * causing route guards to see user=null and redirect back to /login.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectAuthUser,
  type Role,
  type AuthUser as ReduxAuthUser,
} from "@/store/slices/authSlice";
import { logoutThunk } from "@/thunks/authThunks";

export type { Role };

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: Role;
  title?: string;
  avatarSeed: string;
}

interface AuthCtx {
  user: AuthUser | null;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function makeAvatar(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toAuthUser(u: ReduxAuthUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    title: u.role === "doctor" ? "Doctor" : undefined,
    avatarSeed: makeAvatar(u.name || u.email),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const reduxUser = useAppSelector(selectAuthUser);
  const dispatch = useAppDispatch();

  // Derive user directly from Redux — no local state, no race condition
  const user = reduxUser ? toAuthUser(reduxUser) : null;

  return (
    <Ctx.Provider
      value={{
        user,
        logout: () => {
          dispatch(logoutThunk());
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function homeForRole(role: Role): string {
  return role === "patient"
    ? "/patient"
    : role === "doctor"
    ? "/doctor"
    : "/admin";
}