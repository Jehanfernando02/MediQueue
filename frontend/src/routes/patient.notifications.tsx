import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/ui/glass";
import { Bell, CheckCircle2, AlertCircle, Pill as PillIcon, Calendar } from "lucide-react";

export const Route = createFileRoute("/patient/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MediQueue" }] }),
  component: Notifs,
});

const ITEMS = [
  { i: CheckCircle2, t: "Appointment confirmed", d: "Dr. Aris Thorne on Oct 14 at 09:30 AM has been confirmed.", time: "2h ago", tone: "clinical" as const },
  { i: PillIcon, t: "Prescription ready for pickup", d: "Atorvastatin 20mg is ready at Pacific Pharmacy.", time: "Yesterday", tone: "brand" as const },
  { i: Calendar, t: "Reminder: visit tomorrow", d: "Bring your insurance card and previous lab reports.", time: "Yesterday", tone: "warn" as const },
  { i: AlertCircle, t: "Lab results available", d: "Your routine bloodwork results are now in your portal.", time: "2 days ago", tone: "muted" as const },
];

const TONES = {
  clinical: "bg-clinical-soft text-clinical",
  brand: "bg-brand-soft text-brand",
  warn: "bg-warn-soft text-warn",
  muted: "bg-muted text-muted-foreground",
};

function Notifs() {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay on top of every update from your care team.</p>
        </div>
        <button className="text-sm font-semibold text-brand">Mark all as read</button>
      </header>

      <GlassCard className="divide-y divide-border">
        {ITEMS.map((n, i) => {
          const Icon = n.i;
          return (
            <div key={i} className="flex items-start gap-4 p-5 hover:bg-muted/40 transition-colors">
              <div className={["size-10 rounded-2xl grid place-items-center", TONES[n.tone]].join(" ")}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold">{n.t}</h4>
                  <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.d}</p>
              </div>
            </div>
          );
        })}
        <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <Bell className="size-5 opacity-40" />
          You're all caught up.
        </div>
      </GlassCard>
    </div>
  );
}
