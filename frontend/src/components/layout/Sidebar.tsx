import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarPlus, Activity, CalendarCheck, Bell,
  Stethoscope, Users, ClipboardList, BarChart3, Building2, ShieldCheck, FileText,
  Heart,
} from "lucide-react";
import type { Role } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Item { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const NAV: Record<Role, { section: string; items: Item[] }[]> = {
  patient: [
    {
      section: "Care",
      items: [
        { to: "/patient", label: "Overview", icon: LayoutDashboard },
        { to: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
        { to: "/patient/queue", label: "Live Queue", icon: Activity },
        { to: "/patient/appointments", label: "My Appointments", icon: CalendarCheck },
      ],
    },
    {
      section: "Account",
      items: [{ to: "/patient/notifications", label: "Notifications", icon: Bell }],
    },
  ],
  doctor: [
    {
      section: "Today",
      items: [
        { to: "/doctor", label: "Today's Queue", icon: Activity },
        { to: "/doctor/schedule", label: "Weekly Schedule", icon: CalendarCheck },
        { to: "/doctor/patients", label: "Patient Roster", icon: Users },
      ],
    },
  ],
  admin: [
    {
      section: "Operations",
      items: [
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/appointments", label: "All Appointments", icon: ClipboardList },
        { to: "/admin/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      section: "Management",
      items: [
        { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
        { to: "/admin/departments", label: "Departments", icon: Building2 },
        { to: "/admin/audit", label: "Audit Logs", icon: ShieldCheck },
      ],
    },
  ],
};

export function NavContent({ className }: { className?: string }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;
  const groups = NAV[user.role];

  return (
    <nav className={cn("flex-1 px-3 overflow-y-auto", className)}>
      {groups.map((group) => (
        <div key={group.section} className="mb-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-5 pb-2 flex items-center gap-2">
            <span className="size-1 rounded-full bg-brand/50" />
            {group.section}
          </div>
          <div className="space-y-0.5">
            {group.items.map((it) => {
              const active = pathname === it.to || (it.to !== `/${user.role}` && pathname.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-sm transition-all duration-300 group",
                    active
                      ? "nav-active text-brand font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className={cn("size-4 transition-transform group-hover:scale-110", active ? "text-brand" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="hidden lg:flex w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex-col sticky top-0 h-screen noise-overlay">
      <div className="p-7 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shadow-lg shadow-brand/40 shimmer-sweep">
          <Heart className="size-5" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-foreground">MediQueue</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Clinical OS</div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-sidebar-border to-transparent mb-2" />

      <NavContent />

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-sidebar-border backdrop-blur-md">
          <div className="size-10 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-sm shadow-lg shadow-brand/20">
            {user.avatarSeed}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-bold">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { FileText };
