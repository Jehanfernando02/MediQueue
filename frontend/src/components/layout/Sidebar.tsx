import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarPlus, Activity, CalendarCheck, Bell,
  Stethoscope, Users, ClipboardList, BarChart3, Building2, ShieldCheck, FileText,
  Heart,
} from "lucide-react";
import type { Role } from "@/lib/auth";
import { useAuth } from "@/lib/auth";

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

export function Sidebar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;
  const groups = NAV[user.role];

  return (
    <aside className="hidden lg:flex w-72 shrink-0 border-r border-border bg-sidebar flex-col sticky top-0 h-screen">
      <div className="p-7 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shadow-lg shadow-brand/25">
          <Heart className="size-5" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">MediQueue</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical OS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.section} className="mb-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-5 pb-2">
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
                    className={[
                      "flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-sm transition-colors",
                      active
                        ? "nav-active text-brand font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/60">
          <div className="size-10 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-sm">
            {user.avatarSeed}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.title}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { FileText };
