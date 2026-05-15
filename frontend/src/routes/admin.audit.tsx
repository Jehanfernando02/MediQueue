import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill } from "@/components/ui/glass";
import { ShieldCheck, UserCog, FilePlus2, LogIn, Pill as PillIcon, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit logs — MediQueue" }] }),
  component: Audit,
});

const LOGS = [
  { i: LogIn, who: "helena@mediqueue.io", action: "Signed in", target: "admin console", t: "2m ago", tone: "muted" as const },
  { i: UserCog, who: "helena@mediqueue.io", action: "Updated doctor", target: "Dr. Sarah Chen", t: "14m ago", tone: "brand" as const },
  { i: FilePlus2, who: "Dr. Aris Thorne", action: "Created consultation note", target: "Patient #2041", t: "32m ago", tone: "clinical" as const },
  { i: PillIcon, who: "Dr. Aris Thorne", action: "Issued prescription", target: "Atorvastatin 20mg • Patient #2041", t: "33m ago", tone: "clinical" as const },
  { i: AlertTriangle, who: "system", action: "Wait threshold exceeded", target: "Oncology unit (45m+)", t: "1h ago", tone: "warn" as const },
  { i: ShieldCheck, who: "system", action: "Backup completed", target: "Encrypted snapshot 0xA92E", t: "3h ago", tone: "clinical" as const },
];

const TONES: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  clinical: "bg-clinical-soft text-clinical",
  warn: "bg-warn-soft text-warn",
  muted: "bg-muted text-muted-foreground",
};

function Audit() {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit logs</h1>
          <p className="text-muted-foreground mt-2">Immutable record of every action across the system.</p>
        </div>
        <Pill tone="clinical" dot>Tamper-evident</Pill>
      </header>

      <GlassCard className="p-6 lg:p-8">
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-5">
            {LOGS.map((l, i) => {
              const Icon = l.i;
              return (
                <div key={i} className="relative pl-12">
                  <div className={["absolute left-0 top-1.5 size-10 rounded-2xl grid place-items-center border border-border", TONES[l.tone]].join(" ")}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold">{l.who}</span>{" "}
                        <span className="text-muted-foreground">{l.action}</span>{" "}
                        <span className="font-semibold">{l.target}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">sig: 0x{(Math.random() * 1e16).toString(16).slice(0, 16)}</div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{l.t}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
