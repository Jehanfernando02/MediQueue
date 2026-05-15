/**
 * lib/auth.tsx — Auth bridge
 *
 * Keeps the AuthProvider / useAuth surface that all route layouts use.
 * State is sourced from Redux (store/slices/authSlice).
 * logout() dispatches the real logoutThunk from thunks/.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectAuthUser, type Role, type AuthUser as ReduxAuthUser } from "@/store/slices/authSlice";
import { logoutThunk } from "@/thunks/authThunks";

export type { Role };

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: Role;
  title?: string;
  avatarSeed: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, role: Role, name?: string) => void;
  logout: () => void;
  setRole: (role: Role) => void;
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

  // Shim for pages not yet migrated to Redux thunks
  const [shimUser, setShimUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (reduxUser) setShimUser(toAuthUser(reduxUser));
    else setShimUser(null);
  }, [reduxUser]);

  const user = reduxUser ? toAuthUser(reduxUser) : shimUser;

  return (
    <Ctx.Provider
      value={{
        user,
        login: (email, role, name) => {
          setShimUser({
            email,
            role,
            name: name ?? email,
            avatarSeed: makeAvatar(name ?? email),
          });
        },
        logout: () => {
          setShimUser(null);
          dispatch(logoutThunk());
        },
        setRole: (role) => {
          if (user) setShimUser({ ...user, role });
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
  return role === "patient" ? "/patient" : role === "doctor" ? "/doctor" : "/admin";
}
