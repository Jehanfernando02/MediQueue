import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth, type Role, homeForRole } from "@/lib/auth";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { demoLoginThunk } from "@/thunks/authThunks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  role: Role;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({ role, title, subtitle, action, children }: Props) {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to={homeForRole(user.role)} />;

  const isDemo = user.email?.endsWith("@demo.mediqueue.org");

  const handleRoleSwitch = async (targetRole: string) => {
    const toastId = toast.loading(`Switching to ${targetRole} view...`);
    const result = await dispatch(demoLoginThunk(targetRole));
    
    if (result.success) {
      toast.success(`Switched view`, {
        id: toastId,
        description: `Logged in as demo ${result.user.role}`,
      });
      navigate({ to: homeForRole(result.user.role) });
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      toast.error("Failed to switch role", {
        id: toastId,
        description: result.error,
      });
    }
  };

  return (
    <div className="min-h-screen flex soft-gradient">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} action={action} />
        <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10 max-w-[1400px] mx-auto w-full fade-in">
          {isDemo && (
            <div className="mb-6 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
              {/* Glow accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-clinical" />
              
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 grid place-items-center shrink-0 mt-0.5 animate-pulse">
                  <Sparkles className="size-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-400">MediQueue Showcase Guide</span>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-teal-500/15 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30 shadow-sm animate-pulse">Active Tour</span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1.5">
                    {role === "patient" && "Patient Self-Service Portal"}
                    {role === "doctor" && "Clinician Queue Console"}
                    {role === "admin" && "Clinic Operations Center"}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl font-medium">
                    {role === "patient" && "👉 Explore booking calendars, schedule slots with physicians, check your live rank in the queue, and see real-time clinic notifications."}
                    {role === "doctor" && "👉 Check-in patients (click 'Arrived'), write clinical diagnostic consultation notes, and inspect weekly clinic shifts."}
                    {role === "admin" && "👉 Track advanced system operational audit logs, update clinic departments, manage staff, and analyze throughput charts."}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 pl-1.5 pr-1">Jump to:</span>
                  {[
                    { r: "patient", label: "Patient" },
                    { r: "doctor", label: "Doctor" },
                    { r: "admin", label: "Admin" },
                  ].map((btn) => {
                    const isActive = role === btn.r;
                    return (
                      <button
                        key={btn.r}
                        onClick={() => handleRoleSwitch(btn.r)}
                        disabled={isActive}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                          isActive
                            ? "bg-violet-500/20 border-violet-500/40 text-violet-300 font-black"
                            : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem("mediqueue.demo_completed", "true");
                    sessionStorage.removeItem("mediqueue.showcase_active");
                    logout();
                    window.location.href = "/login";
                  }}
                  className="py-2.5 px-4.5 rounded-xl bg-gradient-to-r from-brand to-clinical text-brand-foreground text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.97] transition-all text-center flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 shimmer-sweep cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  Finish Exploring
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
