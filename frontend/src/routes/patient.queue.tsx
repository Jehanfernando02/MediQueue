import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill, StatCard } from "@/components/ui/glass";
import { Activity, MapPin, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPatientPositionThunk } from "@/thunks/queueThunks";
import { selectPatientPosition, selectQueueStatus } from "@/store/slices/queueSlice";
import { selectUpcomingAppointments } from "@/store/slices/appointmentSlice";
import { fetchMyAppointmentsThunk } from "@/thunks/appointmentThunks";

export const Route = createFileRoute("/patient/queue")({
  head: () => ({ meta: [{ title: "Live queue — MediQueue" }] }),
  component: Queue,
});

function Queue() {
  const dispatch = useAppDispatch();
  const position = useAppSelector(selectPatientPosition);
  const status = useAppSelector(selectQueueStatus);
  const upcoming = useAppSelector(selectUpcomingAppointments);
  const [refreshing, setRefreshing] = useState(false);

  // We need an active appointment for today to show queue position
  const todayAppt = upcoming.find(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear() &&
           a.status !== "done" && a.status !== "cancelled";
  });

  const loadData = async () => {
    setRefreshing(true);
    await dispatch(fetchMyAppointmentsThunk());
    if (todayAppt) {
      await dispatch(fetchPatientPositionThunk(todayAppt.doctor_id, todayAppt.date));
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [dispatch, !!todayAppt]);


  const loading = status === "loading" && !position;

  if (!todayAppt && !loading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Live queue tracker</h1>
          <p className="text-muted-foreground mt-2">No active appointment for today.</p>
        </header>
        <GlassCard className="p-12 text-center text-muted-foreground">
          <Activity className="size-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">You don't have any appointments scheduled for today.</p>
          <p className="mt-2">Once you have an active appointment, your live position will appear here.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live queue tracker</h1>
          <p className="text-muted-foreground mt-2">Real-time updates for your consultation.</p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <GlassCard className="p-8 bg-gradient-to-br from-brand to-clinical text-white border-none relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.2),transparent_60%)]" />
        <div className="relative">
          <Pill tone="brand" className="!bg-white/20 !text-white">
            <span className="size-1.5 rounded-full bg-white pulse-dot" /> Live
          </Pill>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : position ? (
            <div className="mt-6 grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Your position</div>
                <div className="text-6xl font-bold tracking-tight mt-2">#{position.position}</div>
                <div className="text-sm text-white/80 mt-1">in the queue</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Estimated wait</div>
                <div className="text-6xl font-bold tracking-tight mt-2">{position.eta_minutes}<span className="text-2xl font-normal text-white/80 ml-1">min</span></div>
                <div className="text-sm text-white/80 mt-1">Based on avg consult time</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Ahead of you</div>
                <div className="text-6xl font-bold tracking-tight mt-2">{position.ahead}</div>
                <div className="text-sm text-white/80 mt-1 flex items-center gap-1.5">Patients waiting</div>
              </div>
            </div>
          ) : (
            <div className="mt-6 py-12 text-center">
              <p>Queue information unavailable. Try refreshing.</p>
            </div>
          )}
        </div>
      </GlassCard>

      <section className="grid md:grid-cols-3 gap-4">
        <StatCard label="Total in queue" value={position?.total_in_queue ?? "—"} icon={<Activity className="size-4 text-brand" />} />
        <StatCard label="Avg consult time" value="15m" tone="clinical" />
        <StatCard label="Clinic Status" value="On-track" tone="brand" />
      </section>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold mb-5">Your Appointment Details</h3>
        {todayAppt && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
            <div className="size-12 rounded-2xl bg-brand/10 text-brand grid place-items-center">
              <Activity className="size-6" />
            </div>
            <div>
              <div className="font-semibold">{todayAppt.reason || "General Consultation"}</div>
              <div className="text-sm text-muted-foreground">
                Scheduled for {new Date(todayAppt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="ml-auto">
              <Pill tone="brand">{todayAppt.status}</Pill>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
