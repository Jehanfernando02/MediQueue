import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, StatCard } from "@/components/ui/glass";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorScheduleThunk, updateDoctorSlotsThunk } from "@/thunks/doctorThunks";
import { selectDoctorSchedule, selectDoctorStatus } from "@/store/slices/doctorSlice";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, Trash2, RotateCcw, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/schedule")({
  head: () => ({ meta: [{ title: "Weekly schedule — MediQueue" }] }),
  component: Schedule,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];

interface TempSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function Schedule() {
  const dispatch = useAppDispatch();
  const schedule = useAppSelector(selectDoctorSchedule);
  const status = useAppSelector(selectDoctorStatus);
  const [viewDate, setViewDate] = useState(new Date());

  // Slot editor modal state
  const [editOpen, setEditOpen] = useState(false);
  const [tempSlots, setTempSlots] = useState<TempSlot[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [saving, setSaving] = useState(false);

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

  // Editor Actions
  const openEditor = () => {
    if (schedule) {
      setTempSlots(
        schedule.availability.map((s) => ({
          day_of_week: s.day,
          start_time: s.start.slice(0, 5),
          end_time: s.end.slice(0, 5),
        }))
      );
    } else {
      setTempSlots([]);
    }
    setActiveDay(0);
    setEditOpen(true);
  };

  const addSlot = (day: number) => {
    if (newStart >= newEnd) {
      toast.error("End time must be after start time.");
      return;
    }
    const daySlots = tempSlots.filter(s => s.day_of_week === day);
    const hasOverlap = daySlots.some(s => {
      return (newStart >= s.start_time && newStart < s.end_time) ||
             (newEnd > s.start_time && newEnd <= s.end_time) ||
             (newStart <= s.start_time && newEnd >= s.end_time);
    });
    if (hasOverlap) {
      toast.error("This slot overlaps with an existing slot.");
      return;
    }
    setTempSlots([...tempSlots, { day_of_week: day, start_time: newStart, end_time: newEnd }]);
    toast.success("Slot added");
  };

  const deleteSlot = (slotToDelete: TempSlot) => {
    setTempSlots(
      tempSlots.filter(
        (s) =>
          !(
            s.day_of_week === slotToDelete.day_of_week &&
            s.start_time === slotToDelete.start_time &&
            s.end_time === slotToDelete.end_time
          )
      )
    );
    toast.success("Slot removed");
  };

  const copyToAllDays = (sourceDay: number) => {
    const sourceSlots = tempSlots.filter(s => s.day_of_week === sourceDay);
    // Replace Mon-Sat slots (0-5) with copies of sourceSlots
    const cleanedSlots = tempSlots.filter(s => s.day_of_week > 5); // Preserve Sunday if any
    const newSlots = [...cleanedSlots];
    for (let d = 0; d < 6; d++) {
      for (const s of sourceSlots) {
        newSlots.push({
          day_of_week: d,
          start_time: s.start_time,
          end_time: s.end_time
        });
      }
    }
    setTempSlots(newSlots);
    toast.success("Applied today's slots to Monday - Saturday");
  };

  const loadDefaults = () => {
    const defaultHours = [
      { start_time: "09:00", end_time: "09:30" },
      { start_time: "09:30", end_time: "10:00" },
      { start_time: "10:00", end_time: "10:30" },
      { start_time: "10:30", end_time: "11:00" },
      { start_time: "11:00", end_time: "11:30" },
      { start_time: "11:30", end_time: "12:00" },
      { start_time: "14:00", end_time: "14:30" },
      { start_time: "14:30", end_time: "15:00" },
      { start_time: "15:00", end_time: "15:30" },
      { start_time: "15:30", end_time: "16:00" },
      { start_time: "16:00", end_time: "16:30" },
    ];
    const defaults = [];
    for (let day = 0; day < 6; day++) {
      for (const block of defaultHours) {
        defaults.push({
          day_of_week: day,
          ...block,
        });
      }
    }
    setTempSlots(defaults);
    toast.success("Loaded default 30-minute schedule template");
  };

  const handleSave = async () => {
    setSaving(true);
    // Format times to HH:MM:00 for the backend
    const formattedSlots = tempSlots.map(s => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time.split(":").length === 2 ? `${s.start_time}:00` : s.start_time,
      end_time: s.end_time.split(":").length === 2 ? `${s.end_time}:00` : s.end_time,
    }));
    const result = await dispatch(updateDoctorSlotsThunk(formattedSlots));
    setSaving(false);
    if (result.success) {
      toast.success("Weekly availability slots updated successfully!");
      setEditOpen(false);
    } else {
      toast.error(result.error || "Failed to update availability slots.");
    }
  };

  const daySlots = tempSlots
    .filter((s) => s.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly schedule</h1>
          <p className="text-muted-foreground mt-2">Manage your consultation blocks and patient flow.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openEditor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-semibold shadow-md shadow-brand/20 hover:opacity-90 transition-all cursor-pointer"
          >
            <Clock className="size-4" /> Edit Availability
          </button>
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

      {/* Edit Availability Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Weekly Availability</DialogTitle>
          </DialogHeader>

          {/* Weekday Selector */}
          <div className="flex border-b border-border my-2 overflow-x-auto no-scrollbar">
            {ALL_DAYS.map((dayName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveDay(idx)}
                className={[
                  "px-3.5 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                  activeDay === idx ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
                ].join(" ")}
              >
                {dayName.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Current Slots for Active Day */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Slots for {ALL_DAYS[activeDay]}
            </h4>

            {daySlots.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/5">
                No slots configured for this day. Patients won't be able to book you.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {daySlots.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border shadow-sm">
                    <span className="text-xs font-mono font-semibold flex items-center gap-1.5 text-foreground/90">
                      <Clock className="size-3.5 text-brand" />
                      {s.start_time} - {s.end_time}
                    </span>
                    <button
                      onClick={() => deleteSlot(s)}
                      className="p-1 rounded-lg hover:bg-danger-soft hover:text-danger text-muted-foreground transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Slot Block */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Add Custom Slot</h5>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Start</label>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/20 text-xs font-semibold"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">End</label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/20 text-xs font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => addSlot(activeDay)}
                className="px-4 py-2.5 rounded-xl bg-brand text-brand-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-md shadow-brand/10 transition-all flex items-center gap-1.5 h-9 cursor-pointer"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => copyToAllDays(activeDay)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Copy className="size-3.5" /> Copy Day Schedule
            </button>
            <button
              type="button"
              onClick={loadDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" /> Reset Defaults
            </button>
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand text-brand-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-lg shadow-brand/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
