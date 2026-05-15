import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "patient" | "doctor" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
  title?: string;
  avatarSeed: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  setRole: (role: Role) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const ROLE_PROFILES: Record<Role, Omit<AuthUser, "email" | "role">> = {
  patient: { name: "John Carter", title: "Member since 2024", avatarSeed: "JC" },
  doctor: { name: "Dr. Aris Thorne", title: "Cardiology • Senior Consultant", avatarSeed: "AT" },
  admin: { name: "Helena Vasquez", title: "Clinic Operations Lead", avatarSeed: "HV" },
};

const STORAGE_KEY = "mediqueue.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        login: (email, role) => {
          const p = ROLE_PROFILES[role];
          persist({ ...p, email, role });
        },
        logout: () => persist(null),
        setRole: (role) => {
          const p = ROLE_PROFILES[role];
          persist({ ...p, email: user?.email ?? `${role}@mediqueue.io`, role });
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
