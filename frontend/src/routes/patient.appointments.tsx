import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Calendar, MapPin, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/patient/appointments")({
  head: () => ({ meta: [{ title: "My appointments — MediQueue" }] }),
  component: Appts,
});

const ITEMS = [
  { date: "Oct 14, 2025", time: "09:30 AM", doc: "Dr. Aris Thorne", spec: "Cardiology", room: "Room 304", status: "Confirmed", tone: "brand" as const, upcoming: true },
  { date: "Oct 22, 2025", time: "02:15 PM", doc: "Dr. Sarah Chen", spec: "Dermatology", room: "Room 110", status: "Pending", tone: "warn" as const, upcoming: true },
  { date: "Sep 28, 2025", time: "10:00 AM", doc: "Dr. Marcus Lee", spec: "Pediatrics", room: "Room 208", status: "Completed", tone: "clinical" as const, upcoming: false },
  { date: "Sep 12, 2025", time: "04:00 PM", doc: "Dr. Aris Thorne", spec: "Cardiology", room: "Room 304", status: "Completed", tone: "clinical" as const, upcoming: false },
  { date: "Aug 30, 2025", time: "11:30 AM", doc: "Dr. Priya Rao", spec: "Neurology", room: "Room 412", status: "Cancelled", tone: "danger" as const, upcoming: false },
];

function Appts() {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My appointments</h1>
          <p className="text-muted-foreground mt-2">Your full visit history and upcoming schedule.</p>
        </div>
      </header>

      <GlassCard className="p-6 lg:p-8">
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {ITEMS.map((a, i) => (
              <div key={i} className="relative pl-12">
                <div className={[
                  "absolute left-0 top-1.5 size-10 rounded-2xl grid place-items-center border",
                  a.upcoming ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20" : "bg-card border-border text-muted-foreground",
                ].join(" ")}>
                  <Calendar className="size-4" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
                  <div className="md:w-32">
                    <div className="text-xs text-muted-foreground">{a.date}</div>
                    <div className="text-base font-bold tracking-tight">{a.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{a.doc}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{a.spec}</span>
                      <span className="flex items-center gap-1"><MapPin className="size-3" /> {a.room}</span>
                    </div>
                  </div>
                  <Pill tone={a.tone}>{a.status}</Pill>
                  <button className="size-9 rounded-full border border-border grid place-items-center hover:bg-card text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
