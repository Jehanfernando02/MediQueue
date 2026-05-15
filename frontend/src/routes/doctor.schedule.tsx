import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, StatCard } from "@/components/ui/glass";

export const Route = createFileRoute("/doctor/schedule")({
  head: () => ({ meta: [{ title: "Weekly schedule — MediQueue" }] }),
  component: Schedule,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];
const APPTS = [
  { d: 0, h: 1, dur: 1, name: "S. Jenkins", tone: "brand" },
  { d: 0, h: 3, dur: 2, name: "M. Lewis", tone: "clinical" },
  { d: 1, h: 1, dur: 1, name: "E. Halloway", tone: "brand" },
  { d: 1, h: 5, dur: 1, name: "D. Ortiz", tone: "warn" },
  { d: 2, h: 0, dur: 1, name: "A. Holloway", tone: "clinical" },
  { d: 2, h: 4, dur: 2, name: "Block: Surgery", tone: "muted" },
  { d: 3, h: 2, dur: 1, name: "P. Rao consult", tone: "brand" },
  { d: 4, h: 1, dur: 3, name: "Cardiac clinic", tone: "clinical" },
  { d: 5, h: 2, dur: 2, name: "On call", tone: "warn" },
];
const TONES: Record<string, string> = {
  brand: "bg-brand-soft text-brand border-brand/30",
  clinical: "bg-clinical-soft text-clinical border-clinical/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  muted: "bg-muted text-muted-foreground border-border",
};

function Schedule() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Weekly schedule</h1>
        <p className="text-muted-foreground mt-2">Week of October 13 — 18, 2025</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Booked hours" value="34" hint="of 40 capacity" tone="brand" />
        <StatCard label="Patients" value="68" tone="clinical" />
        <StatCard label="Free slots" value="12" />
        <StatCard label="Utilization" value="85%" tone="brand" />
      </section>

      <GlassCard className="p-6 overflow-x-auto">
        <div className="min-w-[800px] grid" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)` }}>
          <div />
          {DAYS.map((d) => (
            <div key={d} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center pb-3 border-b border-border">{d}</div>
          ))}
          {HOURS.map((h, hi) => (
            <>
              <div key={"h" + h} className="text-[11px] font-mono text-muted-foreground pr-2 text-right py-2 border-b border-border">{h}:00</div>
              {DAYS.map((_, di) => {
                const item = APPTS.find((a) => a.d === di && a.h === hi);
                return (
                  <div key={di + "-" + hi} className="border-b border-l border-border h-14 relative">
                    {item && (
                      <div
                        className={["absolute inset-x-1 top-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold leading-tight", TONES[item.tone]].join(" ")}
                        style={{ height: `${item.dur * 56 - 8}px` }}
                      >
                        {item.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
