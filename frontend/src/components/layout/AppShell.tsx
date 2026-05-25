import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth, type Role, homeForRole } from "@/lib/auth";
import { Navigate } from "@tanstack/react-router";

interface Props {
  role: Role;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({ role, title, subtitle, action, children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to={homeForRole(user.role)} />;

  return (
    <div className="min-h-screen flex soft-gradient">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} action={action} />
        <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10 max-w-[1400px] mx-auto w-full fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
