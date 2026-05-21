import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill, StatCard } from "@/components/ui/glass";
import {
  Activity, Clock, CheckCircle2, X, Play, FileText, ChevronRight, Loader2, RefreshCw,
  User, Sparkles, AlertCircle,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorTodayAppointmentsThunk, updateAppointmentStatusThunk, addAppointmentNoteThunk } from "@/thunks/appointmentThunks";
import { fetchDoctorQueueStatsThunk } from "@/thunks/queueThunks";
import { selectMyAppointments, selectAppointmentStatus } from "@/store/slices/appointmentSlice";
import { selectDoctorQueueStats } from "@/store/slices/queueSlice";
import type { Appointment } from "@/store/slices/appointmentSlice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/")({
  head: () => ({ meta: [{ title: "Today's queue — MediQueue" }] }),
  component: DoctorHome,
});


type DoctorAppointment = Appointment & { patient_name?: string };

type StatusFilter = "all" | Appointment["status"];

function statusTone(s: string): "clinical" | "brand" | "muted" | "warn" {
  return s === "in_progress" ? "clinical" : s === "arrived" ? "brand" : s === "done" ? "muted" : "warn";
}

function formatTime(isoTime: string) {
  const t = isoTime.includes("T") ? isoTime.split("T")[1] : isoTime;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function DoctorHome() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectMyAppointments) as DoctorAppointment[];
  const queueStats = useAppSelector(selectDoctorQueueStats);
  const loadStatus = useAppSelector(selectAppointmentStatus);

  const [active, setActive] = useState<DoctorAppointment | null>(null);
  const [tab, setTab] = useState<StatusFilter>("all");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDoctorTodayAppointmentsThunk()),
      dispatch(fetchDoctorQueueStatsThunk()),
    ]);
    setRefreshing(false);
  };

  useEffect(() => { 
    load(); 
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);


  const loading = loadStatus === "loading" && appointments.length === 0;

  const move = async (id: string, status: string) => {
    const result = await dispatch(updateAppointmentStatusThunk(id, status));
    if (result.success) {
      toast.success(`Patient marked ${status.replace("_", " ")}`);
      dispatch(fetchDoctorQueueStatsThunk());
    } else {
      toast.error("Failed to update status");
    }
  };

  const saveNotes = async () => {
    if (!active || !notes.trim()) return;
    setSavingNotes(true);
    const result = await dispatch(addAppointmentNoteThunk(active.id, notes));
    setSavingNotes(false);
    if (result.success) {
      toast.success("Notes saved");
      setActive(null);
      setNotes("");
    } else {
      toast.error("Failed to save notes");
    }
  };

  const counts = {
    all: appointments.length,
    arrived: appointments.filter((p) => p.status === "arrived").length,
    in_progress: appointments.filter((p) => p.status === "in_progress").length,
    scheduled: appointments.filter((p) => p.status === "scheduled").length,
    done: appointments.filter((p) => p.status === "done").length,
    cancelled: appointments.filter((p) => p.status === "cancelled").length,
    no_show: appointments.filter((p) => p.status === "no_show").length,
  };

  const filtered =
    tab === "all" ? appointments : appointments.filter((p) => p.status === tab);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 stagger-in" style={{ "--delay": "0.1s" } as any}>
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clinical/10 text-clinical text-[10px] font-black uppercase tracking-widest mb-4 border border-clinical/20 shadow-sm">
            <Sparkles className="size-3" /> Operations Center
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">Today's Queue</h1>
          <p className="text-muted-foreground mt-3 font-medium text-lg">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <Pill tone="clinical" dot icon={<Activity className="size-3" />}>Live Operations</Pill>
          <button
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-card/60 backdrop-blur-md text-xs font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("size-4 text-brand", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-in" style={{ "--delay": "0.2s" } as any}>
        <StatCard
          label="Patients"
          value={loading ? "—" : String(queueStats?.total ?? counts.all)}
          tone="brand"
          hint={queueStats ? `${queueStats.remaining} remaining` : "Loading statistics…"}
          icon={<User className="size-5" />}
        />
        <StatCard
          label="Consulting"
          value={loading ? "—" : String(queueStats?.in_progress ?? counts.in_progress)}
          tone="clinical"
          hint="Active sessions"
          icon={<Activity className="size-5" />}
        />
        <StatCard
          label="Avg Consult"
          value={loading ? "—" : `${queueStats?.avg_time_per_patient ?? 15}m`}
          hint="Per patient"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Efficiency"
          value={loading ? "—" : `${Math.round(((queueStats?.completed ?? counts.done) / ((queueStats?.total ?? counts.all) || 1)) * 100)}%`}
          tone="clinical"
          hint="Completion rate"
          icon={<Sparkles className="size-5" />}
        />
      </section>

      {/* Tab filters */}
      <GlassCard className="p-2 stagger-in" style={{ "--delay": "0.3s" } as any}>
        <div className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar">
          {([
            ["all", "All Sessions"],
            ["arrived", "Arrived"],
            ["in_progress", "In Progress"],
            ["scheduled", "Scheduled"],
            ["done", "Completed"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k as StatusFilter)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 whitespace-nowrap active:scale-95",
                tab === k 
                  ? "bg-brand text-brand-foreground shadow-lg shadow-brand/25" 
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              {l}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold", 
                tab === k 
                  ? "bg-brand-foreground/20 text-brand-foreground" 
                  : "bg-muted-foreground/10 text-muted-foreground"
              )}>
                {counts[k as keyof typeof counts] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Queue list */}
      <div className="stagger-in" style={{ "--delay": "0.4s" } as any}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
            <div className="relative">
               <Loader2 className="size-10 animate-spin text-brand/20" />
               <Activity className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-40">Syncing queue data…</span>
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-20 text-center text-muted-foreground border-dashed">
            <div className="size-20 rounded-[2.5rem] bg-muted/30 grid place-items-center mx-auto mb-6">
               <Activity className="size-8 opacity-20" />
            </div>
            <p className="text-lg font-black tracking-tight text-foreground/40">Queue is currently clear.</p>
            <p className="text-xs font-bold mt-2 uppercase tracking-widest opacity-40">Waiting for patients to arrive.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filtered.map((p, i) => {
              const isActive = p.status === "in_progress";
              return (
                <GlassCard 
                  key={p.id} 
                  hover 
                  className={cn(
                    "p-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden stagger-in",
                    isActive && "ring-2 ring-clinical shadow-2xl shadow-clinical/10"
                  )}
                  style={{ "--delay": `${0.5 + i * 0.05}s` } as any}
                >
                   {isActive && (
                      <div className="absolute top-0 left-0 bottom-0 w-2 bg-clinical animate-pulse" />
                   )}
                   
                  <button
                    onClick={() => { setActive(p); setNotes(""); }}
                    className="flex items-center gap-6 flex-1 min-w-0 text-left group"
                  >
                    <div className="relative shrink-0">
                       <div className="size-16 rounded-3xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-black text-lg shadow-xl group-hover:scale-110 transition-transform">
                        {initials(p.patient_name ?? "P")}
                      </div>
                      <div className="absolute -bottom-1 -right-1 size-6 bg-background rounded-2xl grid place-items-center border-2 border-background shadow-sm">
                         <div className="text-[10px] font-black text-brand">#{p.queue_number ?? "—"}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-black tracking-tighter text-foreground/90 group-hover:text-brand transition-colors">
                        {p.patient_name ?? `Patient ${p.patient_id.slice(0, 8)}`}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {p.reason ?? "General consultation"}
                      </div>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 md:flex md:items-center gap-8 md:gap-12">
                    <div className="md:w-24">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1.5 opacity-60">Session Slot</div>
                      <div className="text-sm font-black font-mono tracking-tighter flex items-center gap-2">
                        <Clock className="size-3.5 text-brand" />
                        {formatTime(p.start_time)}
                      </div>
                    </div>
                    <Pill tone={statusTone(p.status)} dot={isActive} icon={isActive ? <Activity className="size-3" /> : undefined}>
                      {p.status.replace("_", " ")}
                    </Pill>
                  </div>

                  <div className="flex items-center gap-3 md:ml-6">
                    {p.status === "scheduled" && (
                      <button
                        onClick={() => move(p.id, "arrived")}
                        className="h-11 px-5 rounded-2xl border border-border bg-card text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95 shadow-sm"
                      >
                        Mark Arrived
                      </button>
                    )}
                    {p.status === "arrived" && (
                      <button
                        onClick={() => move(p.id, "in_progress")}
                        className="h-11 px-6 rounded-2xl bg-brand text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/25 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shimmer-sweep"
                      >
                        <Play className="size-3.5" /> Start Consult
                      </button>
                    )}
                    {p.status === "in_progress" && (
                      <button
                        onClick={() => move(p.id, "done")}
                        className="h-11 px-6 rounded-2xl bg-clinical text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-clinical/25 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 shimmer-sweep"
                      >
                        <CheckCircle2 className="size-3.5" /> Complete
                      </button>
                    )}
                    {p.status === "done" && (
                      <button
                        onClick={() => { setActive(p); setNotes(""); }}
                        className="h-11 px-6 rounded-2xl border border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
                      >
                        <FileText className="size-3.5" /> Notes
                      </button>
                    )}
                    <button
                      onClick={() => { setActive(p); setNotes(""); }}
                      className="size-11 rounded-2xl border border-border bg-card grid place-items-center text-muted-foreground hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95 group/btn shadow-sm"
                    >
                      <ChevronRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient detail sheet */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto rounded-l-[3rem] border-none shadow-2xl p-0">
           <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-brand to-clinical" />
          {active && (
            <div className="p-10">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-6">
                  <div className="size-20 rounded-[2rem] bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-black text-2xl shadow-2xl shadow-brand/20">
                    {initials(active.patient_name ?? "P")}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-muted text-[9px] font-black uppercase tracking-widest mb-1.5 border border-border">
                       <Sparkles className="size-2.5 text-brand" /> Patient Record
                    </div>
                    <SheetTitle className="text-3xl font-black tracking-tighter">
                      {active.patient_name ?? `Patient ${active.patient_id.slice(0, 8)}`}
                    </SheetTitle>
                    <SheetDescription className="text-sm font-semibold text-muted-foreground mt-1">{active.reason ?? "General clinical consultation"}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-4 mt-10">
                {[
                  { l: "Consultation Slot", v: formatTime(active.start_time), i: <Clock className="size-3 text-brand" /> },
                  { l: "Queue Identifier", v: active.queue_number ? `#${active.queue_number}` : "—", i: <Activity className="size-3 text-clinical" /> },
                  { l: "Current Status", v: active.status.replace("_", " "), i: <Sparkles className="size-3 text-warn" /> },
                ].map((s) => (
                  <div key={s.l} className="rounded-3xl bg-muted/40 p-5 border border-border/50">
                    <div className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 flex items-center gap-2 mb-2">
                      {s.i} {s.l}
                    </div>
                    <div className="text-base font-black capitalize tracking-tight">{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                     <FileText className="size-4 text-brand" /> Consultation Notes
                  </h4>
                  <div className="text-[10px] font-bold text-muted-foreground italic">Autosaved at {new Date().toLocaleTimeString()}</div>
                </div>
                <div className="rounded-[2.5rem] border-2 border-border bg-card/40 focus-within:border-brand/40 transition-colors p-2 shadow-inner">
                  <textarea
                    rows={8}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter detailed clinical findings, prescriptions, and follow-up advice..."
                    className="w-full p-6 bg-transparent outline-none resize-none text-sm font-medium leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setActive(null)}
                    className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all active:scale-95"
                  >
                    <X className="size-4 mr-2 inline" /> Discard
                  </button>
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes || !notes.trim()}
                    className="h-12 px-10 rounded-2xl bg-brand text-brand-foreground text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand/30 disabled:opacity-60 transition-all active:scale-95 flex items-center gap-2 shimmer-sweep"
                  >
                    {savingNotes ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Save Record
                  </button>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-border">
                 <div className="flex items-center gap-3 p-4 rounded-3xl bg-destructive/5 border border-destructive/10">
                    <AlertCircle className="size-5 text-destructive" />
                    <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-destructive">Emergency Protocol</div>
                       <div className="text-[11px] font-medium text-destructive/80">Immediately escalate if patient shows acute distress.</div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
