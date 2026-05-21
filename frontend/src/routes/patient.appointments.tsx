import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Calendar, Loader2, CalendarPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyAppointmentsThunk, cancelAppointmentThunk } from "@/thunks/appointmentThunks";
import { selectMyAppointments, selectAppointmentStatus } from "@/store/slices/appointmentSlice";
import type { Appointment } from "@/store/slices/appointmentSlice";

export const Route = createFileRoute("/patient/appointments")({
  head: () => ({ meta: [{ title: "My appointments — MediQueue" }] }),
  component: Appts,
});


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(t: string) {
  const raw = t.includes("T") ? t.split("T")[1] : t;
  const [h, m] = raw.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function statusTone(s: string): "brand" | "warn" | "clinical" | "muted" | "danger" {
  if (s === "scheduled" || s === "arrived") return "brand";
  if (s === "in_progress" || s === "done") return "clinical";
  if (s === "cancelled") return "danger";
  return "muted";
}
function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function isUpcoming(a: Appointment) {
  return new Date(a.date) >= new Date() && a.status !== "cancelled" && a.status !== "no_show";
}

function Appts() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectMyAppointments);
  const status = useAppSelector(selectAppointmentStatus);
  const loading = status === "loading" && appointments.length === 0;

  useEffect(() => { dispatch(fetchMyAppointmentsThunk()); }, [dispatch]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    const result = await dispatch(cancelAppointmentThunk(id));
    if (result.success) toast.success("Appointment cancelled");
    else toast.error("Could not cancel appointment");
  };

  const sorted = [
    ...appointments.filter(isUpcoming),
    ...appointments.filter((a) => !isUpcoming(a)),
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My appointments</h1>
          <p className="text-muted-foreground mt-2">Your full visit history and upcoming schedule.</p>
        </div>
        <Link to="/patient/book" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25 hover:scale-105 transition-transform">
          <CalendarPlus className="size-4" /> Book new
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /><span className="text-sm">Loading…</span>
        </div>
      ) : sorted.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Calendar className="size-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">No appointments yet</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Book your first appointment with a doctor.</p>
          <Link to="/patient/book" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25">
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 lg:p-8">
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {sorted.map((a) => {
                const upcoming = isUpcoming(a);
                return (
                  <div key={a.id} className="relative pl-12">
                    <div className={["absolute left-0 top-1.5 size-10 rounded-2xl grid place-items-center border",
                      upcoming ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20" : "bg-card border-border text-muted-foreground"].join(" ")}>
                      <Calendar className="size-4" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                      <div className="md:w-36">
                        <div className="text-xs text-muted-foreground">{formatDate(a.date)}</div>
                        <div className="text-base font-bold">{formatTime(a.start_time)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{a.reason ?? "Appointment"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Booked {formatDate(a.created_at)}</div>
                      </div>
                      <Pill tone={statusTone(a.status)}>{statusLabel(a.status)}</Pill>
                      {upcoming && a.status === "scheduled" && (
                        <button onClick={() => handleCancel(a.id)}
                          className="size-9 rounded-full border border-destructive/30 text-destructive grid place-items-center hover:bg-destructive/10 transition-colors"
                          title="Cancel">
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
