import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { GlassCard, StatCard, Pill, SectionHeading } from "@/components/ui/glass";
import { CalendarPlus, Activity, ChevronRight, Clock, Heart, Stethoscope, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyAppointmentsThunk } from "@/thunks/appointmentThunks";
import {
  selectMyAppointments,
  selectAppointmentStatus,
  selectUpcomingAppointments,
  selectPastAppointments,
} from "@/store/slices/appointmentSlice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/")({
  head: () => ({ meta: [{ title: "Patient overview — MediQueue" }] }),
  component: PatientHome,
});


function greeting(name?: string) {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  if (!name) return base;
  return (
    <>
      {base}, <span className="text-gradient font-black">{name}</span>
    </>
  );
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(isoTime: string) {
  const t = isoTime.includes("T") ? isoTime.split("T")[1] : isoTime;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function PatientHome() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const allAppointments = useAppSelector(selectMyAppointments);
  const upcoming = useAppSelector(selectUpcomingAppointments);
  const past = useAppSelector(selectPastAppointments);
  const status = useAppSelector(selectAppointmentStatus);

  useEffect(() => {
    dispatch(fetchMyAppointmentsThunk());
  }, [dispatch]);

  const loading = status === "loading";

  const nextAppt = upcoming[0];
  const nextApptText = nextAppt
    ? `Your next appointment is on ${formatDate(nextAppt.date)}. Everything is on track.`
    : "No upcoming appointments. Book one when you're ready.";

  const wellnessScore = allAppointments.length === 0 ? 0 : Math.min(100, past.filter(a => a.status === "done").length * 5 + 70);

  return (
    <div className="space-y-10">
      <section className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6 stagger-in" style={{ "--delay": "0.1s" } as any}>
         {/* Decorative pattern behind heading */}
        <div className="absolute -top-10 -left-10 size-40 bg-brand/5 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-4 border border-brand/20 shadow-sm">
            <Sparkles className="size-3" /> Patient Dashboard
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
            {greeting(user?.name.split(" ")[0])} <span aria-hidden>👋</span>
          </h1>
          <p className="text-muted-foreground mt-3 font-medium text-lg">{nextApptText}</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <Link to="/patient/book" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-brand text-brand-foreground text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/40 hover:scale-105 transition-all shimmer-sweep">
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
          <Link to="/patient/queue" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-card/60 backdrop-blur-md text-xs font-black uppercase tracking-widest hover:bg-muted transition-all shadow-sm">
            <Activity className="size-4" /> Live queue
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-in" style={{ "--delay": "0.2s" } as any}>
        <StatCard
          label="Upcoming"
          value={loading ? "—" : String(upcoming.length)}
          hint="Next 14 days"
          tone="brand"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Completed"
          value={loading ? "—" : String(past.filter(a => a.status === "done").length)}
          hint="All time"
          tone="clinical"
          icon={<Activity className="size-5" />}
        />
        <StatCard
          label="Total visits"
          value={loading ? "—" : String(allAppointments.length)}
          hint="Clinic history"
          icon={<Stethoscope className="size-5" />}
        />
        <StatCard
          label="Cancelled"
          value={loading ? "—" : String(allAppointments.filter(a => a.status === "cancelled").length)}
          hint="Across all time"
          tone="warn"
          icon={<ChevronRight className="size-5" />}
        />
      </section>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <GlassCard className="p-8 lg:col-span-2 stagger-in" style={{ "--delay": "0.3s" } as any}>
          <SectionHeading
            title="Active Care"
            subtitle="Your upcoming appointments and checkups"
            action={
              <Link to="/patient/appointments" className="text-[10px] font-black uppercase tracking-widest text-brand inline-flex items-center gap-2 hover:opacity-70 transition-opacity">
                View all history <MoveRight className="size-4" />
              </Link>
            }
          />
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="size-6 animate-spin text-brand" />
              <span className="text-sm font-black uppercase tracking-widest opacity-60">Syncing data…</span>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="py-20 text-center glass-card border-dashed bg-muted/20">
              <CalendarPlus className="size-10 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">No upcoming visits found.</p>
              <Link to="/patient/book" className="mt-4 inline-block text-brand font-black uppercase tracking-widest text-xs hover:underline underline-offset-4">
                Schedule your first one →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.slice(0, 5).map((a, i) => {
                const isPending = a.status === "scheduled";
                return (
                  <div
                    key={a.id}
                    className="group flex items-center gap-6 p-4 rounded-[2rem] border border-border bg-muted/20 hover:bg-white/10 hover:border-brand/30 transition-all stagger-in relative overflow-hidden"
                    style={{ "--delay": `${0.4 + i * 0.05}s` } as any}
                  >
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-2",
                      isPending ? "bg-warn" : "bg-brand"
                    )} />
                    
                    <div className="size-16 rounded-3xl bg-card border border-border shadow-sm flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {formatDate(a.date).split(" ")[0]}
                      </span>
                      <span className="text-2xl font-black tracking-tighter leading-none mt-1">
                        {formatDate(a.date).split(" ")[1]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-lg tracking-tight text-foreground/90">
                        {a.reason ?? "Clinical Consultation"}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5">
                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <Clock className="size-3.5" />
                            {formatTime(a.start_time)}
                         </div>
                         <div className="size-1 rounded-full bg-border" />
                         <div className="text-xs text-muted-foreground font-semibold">Dr. Alexander Thorne</div>
                      </div>
                    </div>
                    <Pill tone={isPending ? "warn" : "brand"} dot={!isPending}>
                      {a.status.replace("_", " ")}
                    </Pill>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

         <div className="space-y-8">
            <GlassCard className="p-8 bg-brand text-brand-foreground stagger-in overflow-hidden relative border-none shadow-2xl shadow-brand/20" style={{ "--delay": "0.4s" } as any}>
             <div className="absolute inset-0 bg-gradient-to-br from-brand to-clinical opacity-50" />
             <div className="absolute -top-10 -right-10 size-40 bg-white/10 blur-3xl rounded-full" />
             
             <div className="relative z-10">
               <Heart className="size-10 mb-6 text-brand-foreground animate-pulse" />
               <h3 className="text-2xl font-black tracking-tighter leading-tight">Clinical <br />Wellness Pulse</h3>
               <p className="text-sm font-medium text-brand-foreground/70 mt-2">Personalized score based on consistency.</p>
               
               <div className="mt-10">
                 {loading ? (
                   <div className="flex items-center gap-3 text-brand-foreground/80">
                     <Loader2 className="size-6 animate-spin" />
                     <span className="text-xs font-black uppercase tracking-widest">Calculating…</span>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-end gap-2">
                       <span className="text-7xl font-black tracking-tighter drop-shadow-lg">
                         {allAppointments.length === 0 ? "—" : wellnessScore}
                       </span>
                       {allAppointments.length > 0 && (
                         <span className="text-lg font-black text-brand-foreground/60 mb-2">/ 100</span>
                       )}
                     </div>
                     <div className="mt-6 h-3 w-full bg-brand-foreground/20 rounded-full overflow-hidden shadow-inner border border-brand-foreground/10">
                       <div
                         className="h-full bg-brand-foreground rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                         style={{ width: `${wellnessScore}%` }}
                       />
                     </div>
                     <div className="mt-6 flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-foreground/10 border border-brand-foreground/20 backdrop-blur-md">
                        <div className="size-2 rounded-full bg-brand-foreground animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                         {allAppointments.length === 0
                           ? "Pending First Visit"
                           : wellnessScore > 80 ? "Optimal Care Level" : "Consistency Improving"}
                       </p>
                     </div>
                   </>
                 )}
               </div>
             </div>
           </GlassCard>
          
          <GlassCard className="p-8 stagger-in" style={{ "--delay": "0.5s" } as any}>
              <SectionHeading title="Recent Care" subtitle="Your latest clinical notes" />
               {loading ? (
                <div className="py-6 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-brand/40" />
                </div>
              ) : past.length === 0 ? (
                <p className="text-xs font-bold text-muted-foreground/60 py-4 text-center border-2 border-dashed border-border rounded-3xl">No records yet.</p>
              ) : (
                <div className="space-y-4">
                  {past.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-transparent hover:border-border transition-all group">
                      <div className="size-10 rounded-2xl bg-brand/10 text-brand grid place-items-center group-hover:scale-110 transition-transform">
                        <Stethoscope className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{a.reason ?? "Follow-up Visit"}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{formatDate(a.date)}</div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                    </div>
                  ))}
                </div>
              )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function MoveRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8L22 12L18 16" />
      <path d="M2 12H22" />
    </svg>
  );
}
