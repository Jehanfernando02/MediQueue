import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, StatCard } from "@/components/ui/glass";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorScheduleThunk } from "@/thunks/doctorThunks";
import { selectDoctorSchedule, selectDoctorStatus } from "@/store/slices/doctorSlice";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export const Route = createFileRoute("/doctor/schedule")({
  head: () => ({ meta: [{ title: "Weekly schedule — MediQueue" }] }),
  component: Schedule,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];

function Schedule() {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(selectDoctorSchedule);
  const status = useAppSelector(selectDoctorStatus);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchDoctorScheduleThunk());
  }, [dispatch]);

  const loading = status === "loading" && !schedule;

  // Helper to get appointments for a specific day and hour
  const getAppt = (dayIndex: number, hour: string) => {
    if (!schedule) return null;
    
    // Day Index 0=Mon, 6=Sun. schedule.availability day 0=Mon
    const monday = new Date(schedule.range.from);
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    const dateStr = targetDate.toISOString().split("T")[0];
    
    return schedule.appointments.find(a => {
      if (a.date !== dateStr) return false;
      const apptHour = a.time.split(":")[0];
      return apptHour === hour;
    });
  };

  const isAvailable = (dayIndex: number, hour: string) => {
    if (!schedule) return false;
    return schedule.availability.some(s => s.day === dayIndex && s.start.startsWith(hour));
  };

  const weekRangeText = () => {
    if (!schedule) return "Loading...";
    const start = new Date(schedule.range.from);
    const end = new Date(schedule.range.to);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly schedule</h1>
          <p className="text-muted-foreground mt-2">Manage your consultation blocks and patient flow.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-xl px-2 py-1">
            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"><ChevronLeft className="size-4" /></button>
            <span className="px-4 text-sm font-semibold whitespace-nowrap">{weekRangeText()}</span>
            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-brand" />
          <span className="text-sm font-medium">Synchronizing your schedule…</span>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Booked slots" value={schedule?.appointments.length || 0} hint="Total this week" tone="brand" />
            <StatCard label="Today" value={schedule?.appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length || 0} tone="clinical" />
            <StatCard label="Availability" value={`${schedule?.availability.length || 0} slots`} hint="Active template" />
            <StatCard label="Efficiency" value="High" tone="brand" />
          </section>

          <GlassCard className="p-6 overflow-x-auto">
            <div className="min-w-[800px] grid" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)` }}>
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center pb-3 border-b border-border">{d}</div>
              ))}
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="text-[10px] font-mono text-muted-foreground pr-2 text-right py-4 border-b border-border">{h}:00</div>
                  {DAYS.map((_, di) => {
                    const item = getAppt(di, h);
                    const available = isAvailable(di, h);
                    return (
                      <div key={di + "-" + h} className={[
                        "border-b border-l border-border h-16 relative transition-colors group",
                        available ? "bg-white/5" : "bg-muted/10 grayscale"
                      ].join(" ")}>
                        {item && (
                          <div
                            className={[
                              "absolute inset-x-1 top-1 bottom-1 rounded-xl border px-2.5 py-2 text-[10px] font-bold leading-tight shadow-sm z-10 transition-all group-hover:scale-[1.02]",
                              item.status === "cancelled" ? "bg-muted text-muted-foreground border-border" : "bg-brand/10 text-brand border-brand/20 shadow-brand/5"
                            ].join(" ")}
                          >
                            <div className="truncate">{item.patient_name || "Reserved"}</div>
                            <div className="text-[9px] opacity-70 mt-0.5 capitalize">{item.status.replace("_", " ")}</div>
                          </div>
                        )}
                        {!item && available && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Open Slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
