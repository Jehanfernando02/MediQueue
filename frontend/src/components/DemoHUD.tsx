import { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sparkles, RotateCcw, CheckCircle2, User, Stethoscope, Shield, Info,
  ChevronUp, ChevronDown, Terminal, Database, HelpCircle, ArrowRight
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/store/slices/authSlice";
import { demoLoginThunk, logoutThunk } from "@/thunks/authThunks";
import { homeForRole } from "@/lib/auth";
import axios from "axios";
import { API_BASE } from "@/api/axiosClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChecklistState {
  booked: boolean;
  managed: boolean;
  audited: boolean;
}

export default function DemoHUD() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const routerState = useRouterState();
  
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"checklist" | "tech">("checklist");
  const [seeding, setSeeding] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistState>({
    booked: false,
    managed: false,
    audited: false,
  });

  // Only render HUD for demo accounts
  const isDemoUser = user?.email?.endsWith("@demo.mediqueue.org");
  const currentPath = routerState.location.pathname;

  // Local storage initialization for checklist state
  useEffect(() => {
    const isCompleted = localStorage.getItem("mediqueue.demo_completed") === "true";
    setDemoCompleted(isCompleted);

    if (!isDemoUser) return;
    
    const saved = localStorage.getItem("mediqueue.demo_checklist");
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [isDemoUser]);

  // Auto-detect checklist actions based on router path / state
  useEffect(() => {
    if (!isDemoUser) return;

    let updated = false;
    const newChecklist = { ...checklist };

    // 1. Detect Patient Booking
    if (currentPath === "/patient/appointments" || currentPath === "/patient/queue") {
      if (!newChecklist.booked) {
        newChecklist.booked = true;
        updated = true;
      }
    }

    // 2. Detect Doctor Queue management
    if (currentPath.startsWith("/doctor")) {
      // If doctor is on queue page, let's trigger check or let them check it. 
      // We can also check if they performed status transitions, but simple page visit or checking here is excellent.
      if (!newChecklist.managed && currentPath === "/doctor") {
        newChecklist.managed = true;
        updated = true;
      }
    }

    // 3. Detect Admin Audit trail inspection
    if (currentPath === "/admin/audit") {
      if (!newChecklist.audited) {
        newChecklist.audited = true;
        updated = true;
      }
    }

    if (updated) {
      setChecklist(newChecklist);
      localStorage.setItem("mediqueue.demo_checklist", JSON.stringify(newChecklist));
      toast.success("Sandbox Checklist Updated!", {
        description: "Great job! You are successfully exploring the clinic integrations.",
        duration: 3000,
      });
    }
  }, [currentPath, isDemoUser]);

  if (!isDemoUser || demoCompleted) return null;

  const handleExitTour = async () => {
    localStorage.setItem("mediqueue.demo_completed", "true");
    sessionStorage.removeItem("mediqueue.showcase_active");
    const toastId = toast.loading("Ending showcase session and securing portal...");
    try {
      await dispatch(logoutThunk());
      toast.success("Showcase completed!", {
        id: toastId,
        description: "Sandbox successfully closed. Welcome back to the clean Clinical OS.",
      });
      navigate({ to: "/login" });
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch {
      toast.error("Failed to exit tour properly", { id: toastId });
    }
  };

  const handleRoleSwitch = async (targetRole: string) => {
    const toastId = toast.loading(`Switching to ${targetRole} view...`);
    const result = await dispatch(demoLoginThunk(targetRole));
    
    if (result.success) {
      toast.success(`Switched view`, {
        id: toastId,
        description: `Logged in as demo ${result.user.role}`,
      });
      navigate({ to: homeForRole(result.user.role) });
    } else {
      toast.error("Failed to switch role", {
        id: toastId,
        description: result.error,
      });
    }
  };

  const handleResetData = async () => {
    setSeeding(true);
    const toastId = toast.loading("Re-seeding database with fresh mock clinic data...");
    
    try {
      await axios.post(`${API_BASE}/api/v1/demo/seed`);
      
      // Reset local checklist
      const resetChecklist = { booked: false, managed: false, audited: false };
      setChecklist(resetChecklist);
      localStorage.setItem("mediqueue.demo_checklist", JSON.stringify(resetChecklist));
      
      toast.success("Sandbox reset successfully!", {
        id: toastId,
        description: "Clinic database has been seeded back to a perfect active state.",
      });
      
      // Invalidate router state to refresh all lists
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to reset sandbox database", {
        id: toastId,
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setSeeding(false);
    }
  };

  // Get dynamic Under The Hood text based on role/path
  const getTechDetails = () => {
    if (currentPath.startsWith("/patient")) {
      return {
        title: "Patient Dashboard Booking",
        decisions: [
          {
            name: "High-Concurrency Booking Lock",
            desc: "Worry-free bookings under load. Uses select_for_update() inside a atomic DB transaction to lock target doctor slot rows until commit, fully avoiding double-bookings.",
          },
          {
            name: "Dynamic Queue Positioning",
            desc: "Live queue rankings are computed dynamically skipping completed or cancelled statuses rather than simple row counts, ensuring strict clinical precision.",
          }
        ]
      };
    } else if (currentPath.startsWith("/doctor")) {
      return {
        title: "Doctor Flow OS Console",
        decisions: [
          {
            name: "Atomic Queue Transitions",
            desc: "Fast queue updates. Clicking arrived or done triggers atomic patch operations which instantly broadcast via WebSockets to synchronize patient queue screens.",
          },
          {
            name: "Enriched Medical Timelines",
            desc: "Patient files query multiple profile joints asynchronously, caching notes and diagnostic histories cleanly using TanStack Query queries.",
          }
        ]
      };
    } else if (currentPath.startsWith("/admin")) {
      return {
        title: "Clinic Operations Control Center",
        decisions: [
          {
            name: "Immutable Security Audit logs",
            desc: "True compliance logs. Handled at the FastAPI middleware layer bypassing the service layers. INSERT-ONLY schema restricts updates/deletes entirely.",
          },
          {
            name: "Complex Clinic Insights",
            desc: "Admin analytics leverage advanced PostgreSQL JSONB queries to instantly group appointment distributions and clinic throughput in milliseconds.",
          }
        ]
      };
    } else {
      return {
        title: "MediQueue Hospital Engine",
        decisions: [
          {
            name: "Enterprise Architecture",
            desc: "Three-way RBAC roles mapped via JWT claims. Decoded tokens automatically determine valid frontend router layouts and backend route guards.",
          },
          {
            name: "Strict Token Isolation",
            desc: "Access JWT tokens live only in-memory (Redux state) to eliminate XSS theft. Single-use refresh tokens rotate automatically via Redis cache.",
          }
        ]
      };
    }
  };

  const tech = getTechDetails();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl transition-all duration-300">
      <div className="relative rounded-[2rem] border border-slate-800 shadow-[0_32px_64px_rgba(0,0,0,0.6)] bg-slate-950 text-white overflow-hidden p-6">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
        
        {/* Header HUD */}
        <div className="flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-brand text-brand-foreground grid place-items-center animate-pulse">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">MediQueue Showcase HUD</span>
                <span className="size-2 rounded-full bg-clinical pulse-dot" />
              </div>
              <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 capitalize">
                Exploring: <span className="text-clinical font-black">{user?.role} Mode</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              disabled={seeding}
              className={cn(
                "h-10 px-4 rounded-xl border border-white/10 hover:border-brand/40 bg-white/5 hover:bg-brand/10 text-xs font-black uppercase tracking-widest text-slate-100 hover:text-brand flex items-center gap-2 transition-all disabled:opacity-50",
                seeding && "animate-pulse"
              )}
              title="Reset Sandbox clinic database back to seed template"
            >
              <RotateCcw className={cn("size-3.5", seeding && "animate-spin")} />
              Reset DB
            </button>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="size-10 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              {expanded ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible body panel */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-white/10 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Tabs selector */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
              <button
                onClick={() => setActiveTab("checklist")}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all",
                  activeTab === "checklist" ? "bg-white/10 text-white shadow-sm" : "text-slate-200 hover:text-white"
                )}
              >
                <HelpCircle className="size-3.5" />
                Showcase Guide
              </button>
              <button
                onClick={() => setActiveTab("tech")}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all",
                  activeTab === "tech" ? "bg-white/10 text-white shadow-sm" : "text-slate-200 hover:text-white"
                )}
              >
                <Terminal className="size-3.5" />
                Under the Hood (Tech Specs)
              </button>
            </div>

            {/* Content Tabs */}
            {activeTab === "checklist" ? (
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-slate-200 leading-relaxed">
                  Toggle roles using the buttons below to explore the distinct functional interfaces of this clinical system in read-only Showcase Mode:
                </p>
                <div className="space-y-2">
                  {[
                    {
                      id: "booked",
                      label: "1. Patient Dashboard Tour",
                      desc: "Explore self-service portals, booking selections, schedule calendars, and real-time alerts.",
                      done: checklist.booked,
                      role: "patient",
                    },
                    {
                      id: "managed",
                      label: "2. Doctor Flow OS Tour",
                      desc: "Inspect live wait-time lists, clinician queue status cards, schedules, and clinical notes.",
                      done: checklist.managed,
                      role: "doctor",
                    },
                    {
                      id: "audited",
                      label: "3. Admin Control Tour",
                      desc: "Review live administrative analytic timelines, operational charts, and strict security audit logs.",
                      done: checklist.audited,
                      role: "admin",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-2xl border transition-colors",
                        item.done 
                          ? "bg-clinical/10 border-clinical/20 text-slate-100" 
                          : "bg-white/5 border-white/5 text-slate-100"
                      )}
                    >
                      <button
                        onClick={() => !item.done && handleRoleSwitch(item.role)}
                        className={cn(
                          "size-5 rounded-lg border grid place-items-center shrink-0 mt-0.5 transition-colors",
                          item.done 
                            ? "bg-clinical border-clinical text-slate-900" 
                            : "border-white/20 hover:border-brand bg-white/5"
                        )}
                      >
                        {item.done && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center justify-between gap-2">
                          <span className={cn(item.done && "line-through text-slate-300")}>{item.label}</span>
                          {!item.done && (
                            <button
                              onClick={() => handleRoleSwitch(item.role)}
                              className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline flex items-center gap-0.5 shrink-0"
                            >
                              Go <ArrowRight className="size-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-200 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Walkthrough Instructions */}
                <div className="mt-4 p-3.5 rounded-2xl bg-brand/5 border border-brand/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand mb-2.5 flex items-center gap-1.5">
                    <Info className="size-3.5" />
                    Interactive Guide: What You Can Do
                  </div>
                  <ul className="space-y-2 text-[10px] font-medium leading-relaxed text-slate-200">
                    {currentPath.startsWith("/patient") && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-brand shrink-0">👉</span>
                          <span><strong>Track Queue Position</strong>: View your live rank, active status, and dynamic wait times on the home dashboard.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand shrink-0">👉</span>
                          <span><strong>Book Appointment</strong>: Click <em>Book Appointment</em> in the sidebar to schedule a live slot with a physician.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand shrink-0">👉</span>
                          <span><strong>Read-Only Sandbox</strong>: Try booking a slot. The system will intercept and warn you that write-actions are locked.</span>
                        </li>
                      </>
                    )}
                    {currentPath.startsWith("/doctor") && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-clinical shrink-0">👉</span>
                          <span><strong>Check-in Patients</strong>: Click <em>Arrived</em> on the patient queue cards to transition them in real-time.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-clinical shrink-0">👉</span>
                          <span><strong>Consultation Notes</strong>: Open patient records to write consultation summaries and clinical recommendations.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-clinical shrink-0">👉</span>
                          <span><strong>Schedule View</strong>: Click <em>Schedule</em> in the sidebar to organize clinician shifts and slot distributions.</span>
                        </li>
                      </>
                    )}
                    {currentPath.startsWith("/admin") && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 shrink-0">👉</span>
                          <span><strong>Activity Log Timeline</strong>: Explore the audit trail and toggle <em>Advanced View</em> for raw technical request payloads.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 shrink-0">👉</span>
                          <span><strong>Clinic Operations</strong>: Add or edit clinic departments, staff list, and active doctors.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 shrink-0">👉</span>
                          <span><strong>Insights Charts</strong>: Review historical data exports and clinic throughput statistics.</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                  <Database className="size-4 text-brand" />
                  <span>{tech.title} Architectural Decisions</span>
                </div>
                <div className="space-y-3.5">
                  {tech.decisions.map((dec, i) => (
                    <div key={i} className="text-[10px] font-medium leading-relaxed">
                      <div className="font-bold text-brand flex items-center gap-1.5">
                        <span className="size-1 bg-brand rounded-full" /> {dec.name}
                      </div>
                      <p className="text-slate-200 mt-1 pl-2.5">{dec.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick role-switch buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">Jump to view:</span>
              <div className="flex gap-2">
                {[
                  { r: "patient", icon: User, color: "bg-brand/10 border-brand/20 text-brand" },
                  { r: "doctor", icon: Stethoscope, color: "bg-clinical/10 border-clinical/20 text-clinical" },
                  { r: "admin", icon: Shield, color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
                ].map((btn) => {
                  const Icon = btn.icon;
                  const isActive = user?.role === btn.r;
                  return (
                    <button
                      key={btn.r}
                      onClick={() => handleRoleSwitch(btn.r)}
                      disabled={isActive}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all disabled:opacity-40",
                        isActive 
                          ? "bg-white/20 border-white/40 text-white cursor-default" 
                          : btn.color + " hover:scale-[1.03] active:scale-[0.97]"
                      )}
                    >
                      <Icon className="size-3" />
                      {btn.r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Complete Showcase & Exit Tour */}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={handleExitTour}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand to-clinical text-brand-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.97] transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-brand/20 shimmer-sweep"
              >
                <Sparkles className="size-3.5" />
                Finish Showcase & Exit Tour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
