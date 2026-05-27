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
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"];
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

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

  const toggleSlot = (day: number, time: string) => {
    const timeIndex = TIME_SLOTS.indexOf(time);
    if (timeIndex === -1) return;
    
    const nextTime = TIME_SLOTS[timeIndex + 1];
    if (!nextTime) return;

    const existingSlotIndex = tempSlots.findIndex(
      s => s.day_of_week === day && s.start_time === time && s.end_time === nextTime
    );

    if (existingSlotIndex !== -1) {
      setTempSlots(tempSlots.filter((_, i) => i !== existingSlotIndex));
    } else {
      setTempSlots([...tempSlots, { day_of_week: day, start_time: time, end_time: nextTime }]);
    }
  };

  const isSlotSelected = (day: number, time: string) => {
    const timeIndex = TIME_SLOTS.indexOf(time);
    if (timeIndex === -1) return false;
    
    const nextTime = TIME_SLOTS[timeIndex + 1];
    if (!nextTime) return false;

    return tempSlots.some(
      s => s.day_of_week === day && s.start_time === time && s.end_time === nextTime
    );
  };

  const selectTimeRange = (day: number, startHour: number, endHour: number) => {
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    
    // Remove existing slots in this range
    const filteredSlots = tempSlots.filter(s => {
      if (s.day_of_week !== day) return true;
      return !(s.start_time >= startTime && s.end_time <= endTime);
    });

    // Add new 30-minute slots for the range
    const newSlots = [...filteredSlots];
    let current = startHour;
    while (current < endHour) {
      const slotStart = `${current.toString().padStart(2, '0')}:00`;
      const slotEnd = `${current.toString().padStart(2, '0')}:30`;
      newSlots.push({ day_of_week: day, start_time: slotStart, end_time: slotEnd });
      current += 0.5;
    }

    setTempSlots(newSlots);
    toast.success(`Selected ${startHour}:00 - ${endHour}:00 for ${ALL_DAYS[day]}`);
  };

  const clearDay = (day: number) => {
    setTempSlots(tempSlots.filter(s => s.day_of_week !== day));
    toast.success(`Cleared all slots for ${ALL_DAYS[day]}`);
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
        <DialogContent className="max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Weekly Availability</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Click on time slots to toggle availability. Use quick actions for bulk changes.</p>
          </DialogHeader>

          {/* Weekday Selector */}
          <div className="flex border-b border-border my-4 overflow-x-auto no-scrollbar sticky top-0 bg-background z-10">
            {ALL_DAYS.map((dayName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveDay(idx)}
                className={[
                  "px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                  activeDay === idx ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
                ].join(" ")}
              >
                {dayName}
              </button>
            ))}
          </div>

          {/* Quick Actions for Active Day */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-center mr-2">Quick Actions:</span>
            <button
              type="button"
              onClick={() => selectTimeRange(activeDay, 9, 12)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-brand hover:text-brand-foreground text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Morning (9AM-12PM)
            </button>
            <button
              type="button"
              onClick={() => selectTimeRange(activeDay, 14, 17)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-brand hover:text-brand-foreground text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Afternoon (2PM-5PM)
            </button>
            <button
              type="button"
              onClick={() => selectTimeRange(activeDay, 9, 17)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-brand hover:text-brand-foreground text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Full Day (9AM-5PM)
            </button>
            <button
              type="button"
              onClick={() => selectTimeRange(activeDay, 9, 22)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-brand hover:text-brand-foreground text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Extended (9AM-10PM)
            </button>
            <button
              type="button"
              onClick={() => clearDay(activeDay)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-danger-soft hover:text-danger text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Clear Day
            </button>
          </div>

          {/* Visual Time Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Time Slots for {ALL_DAYS[activeDay]}
            </h4>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {TIME_SLOTS.slice(0, -1).map((time) => {
                const isSelected = isSlotSelected(activeDay, time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleSlot(activeDay, time)}
                    className={[
                      "px-2 py-2 rounded-lg border text-[10px] font-mono font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    ].join(" ")}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            {/* Selected Slots Summary */}
            <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/60">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Selected Slots ({daySlots.length})
                </h5>
                <button
                  type="button"
                  onClick={() => clearDay(activeDay)}
                  className="text-[10px] font-bold uppercase tracking-wider text-danger hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">No slots selected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {daySlots.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand/10 text-brand border border-brand/20 text-[10px] font-mono"
                    >
                      {s.start_time}-{s.end_time}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-border mt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToAllDays(activeDay)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <Copy className="size-3.5" /> Copy to All Days
              </button>
              <button
                type="button"
                onClick={loadDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Load Defaults
              </button>
            </div>
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
              Save Changes ({tempSlots.length} slots)
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
