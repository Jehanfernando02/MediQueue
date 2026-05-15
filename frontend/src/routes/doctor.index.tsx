import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill, StatCard } from "@/components/ui/glass";
import { Activity, Clock, CheckCircle2, X, Play, FileText, ChevronRight } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/")({
  head: () => ({ meta: [{ title: "Today's queue — MediQueue" }] }),
  component: DoctorHome,
});

type Status = "arrived" | "in-progress" | "done" | "scheduled";
interface P {
  id: string; name: string; reason: string; time: string; wait: string; status: Status; room: string; notes: string; initials: string;
}

const SEED: P[] = [
  { id: "1", name: "Sarah Jenkins", reason: "Post-op cardiac review", time: "09:15", wait: "12m", status: "in-progress", room: "304", notes: "Stable vitals; reviewing ECG strip.", initials: "SJ" },
  { id: "2", name: "Marcus Lewis", reason: "Chest pain consult", time: "09:40", wait: "04m", status: "arrived", room: "304", notes: "Reports intermittent pressure; needs ECG.", initials: "ML" },
  { id: "3", name: "Elena Halloway", reason: "Annual physical", time: "10:05", wait: "—", status: "scheduled", room: "304", notes: "Labs pending.", initials: "EH" },
  { id: "4", name: "Daniel Ortiz", reason: "Hypertension follow-up", time: "10:30", wait: "—", status: "scheduled", room: "304", notes: "BP trending down on Lisinopril.", initials: "DO" },
  { id: "5", name: "Arthur Holloway", reason: "Recurring check-up", time: "08:30", wait: "—", status: "done", room: "304", notes: "Stable. Next visit in 3 months.", initials: "AH" },
];

function statusTone(s: Status): "clinical" | "brand" | "muted" | "warn" {
  return s === "in-progress" ? "clinical" : s === "arrived" ? "brand" : s === "done" ? "muted" : "warn";
}

function DoctorHome() {
  const [list, setList] = useState(SEED);
  const [active, setActive] = useState<P | null>(null);
  const [tab, setTab] = useState<"all" | Status>("all");

  const move = (id: string, status: Status) => {
    setList((l) => l.map((p) => (p.id === id ? { ...p, status } : p)));
    toast.success(`Patient marked ${status.replace("-", " ")}`);
  };

  const counts = {
    all: list.length,
    arrived: list.filter((p) => p.status === "arrived").length,
    "in-progress": list.filter((p) => p.status === "in-progress").length,
    scheduled: list.filter((p) => p.status === "scheduled").length,
    done: list.filter((p) => p.status === "done").length,
  };

  const filtered = tab === "all" ? list : list.filter((p) => p.status === tab);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Today's queue</h1>
          <p className="text-muted-foreground mt-2">Tuesday, October 14 • Room 304 • Cardiology</p>
        </div>
        <Pill tone="clinical" dot>Live operations</Pill>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Patients today" value={counts.all} tone="brand" hint="3 new bookings" icon={<Activity className="size-4 text-brand" />} />
        <StatCard label="In progress" value={counts["in-progress"]} tone="clinical" hint="Room 304 active" />
        <StatCard label="Avg consult" value="14m" hint="On target" icon={<Clock className="size-4 text-muted-foreground" />} />
        <StatCard label="Completed" value={counts.done} tone="clinical" hint="So far today" />
      </section>

      <GlassCard className="p-2">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {([
            ["all", "All"], ["arrived", "Arrived"], ["in-progress", "In progress"],
            ["scheduled", "Scheduled"], ["done", "Done"],
          ] as const).map(([k, l]) => (
            <button
              key={k} onClick={() => setTab(k as typeof tab)}
              className={[
                "px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2",
                tab === k ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {l}
              <span className={["text-[10px] px-1.5 rounded-full", tab === k ? "bg-white/20" : "bg-muted-foreground/10"].join(" ")}>
                {counts[k as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-3">
        {filtered.map((p) => (
          <GlassCard key={p.id} hover className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            <button onClick={() => setActive(p)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-sm">
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.reason} • Room {p.room}</div>
              </div>
            </button>
            <div className="grid grid-cols-3 md:flex md:items-center gap-4 md:gap-8">
              <div className="md:w-20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Slot</div>
                <div className="text-sm font-semibold font-mono">{p.time}</div>
              </div>
              <div className="md:w-16">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Wait</div>
                <div className="text-sm font-semibold">{p.wait}</div>
              </div>
              <Pill tone={statusTone(p.status)} dot={p.status === "in-progress"}>{p.status.replace("-", " ")}</Pill>
            </div>
            <div className="flex items-center gap-2 md:ml-4">
              {p.status === "arrived" && (
                <button onClick={() => move(p.id, "in-progress")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold shadow-md shadow-brand/20">
                  <Play className="size-3.5" /> Start
                </button>
              )}
              {p.status === "in-progress" && (
                <button onClick={() => move(p.id, "done")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-clinical text-white text-xs font-semibold">
                  <CheckCircle2 className="size-3.5" /> Complete
                </button>
              )}
              {(p.status === "scheduled") && (
                <button onClick={() => move(p.id, "arrived")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold">
                  Mark arrived
                </button>
              )}
              {p.status === "done" && (
                <button onClick={() => setActive(p)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold">
                  <FileText className="size-3.5" /> Notes
                </button>
              )}
              <button onClick={() => setActive(p)} className="size-9 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold">
                    {active.initials}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{active.name}</SheetTitle>
                    <SheetDescription>{active.reason}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { l: "Slot", v: active.time },
                  { l: "Room", v: active.room },
                  { l: "Status", v: active.status },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-muted p-3">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{s.l}</div>
                    <div className="text-sm font-semibold capitalize mt-1">{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Vitals</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "BP", v: "128/82" },
                    { l: "HR", v: "76 bpm" },
                    { l: "Temp", v: "98.6°F" },
                  ].map((v) => (
                    <div key={v.l} className="rounded-xl border border-border p-3">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{v.l}</div>
                      <div className="text-base font-bold mt-1">{v.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Consultation notes</h4>
                <div className="rounded-xl border border-border bg-card p-1">
                  <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
                    {["B", "I", "U", "•", "1."].map((b) => (
                      <button key={b} className="size-7 rounded-md hover:bg-muted text-xs font-semibold">{b}</button>
                    ))}
                  </div>
                  <textarea
                    rows={6} defaultValue={active.notes}
                    className="w-full p-3 bg-transparent outline-none resize-none text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setActive(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                    <X className="size-3.5" /> Close
                  </button>
                  <button onClick={() => { toast.success("Notes saved"); setActive(null); }} className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold">
                    Save notes
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
