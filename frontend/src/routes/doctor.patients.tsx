import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Search } from "lucide-react";

export const Route = createFileRoute("/doctor/patients")({
  head: () => ({ meta: [{ title: "Patient roster — MediQueue" }] }),
  component: Patients,
});

const ROWS = [
  { name: "Sarah Jenkins", id: "MQ-2041", age: 54, last: "Oct 14, 2025", risk: "Moderate", tone: "warn" as const },
  { name: "Marcus Lewis", id: "MQ-2042", age: 41, last: "Oct 14, 2025", risk: "Low", tone: "clinical" as const },
  { name: "Elena Halloway", id: "MQ-2043", age: 33, last: "Oct 14, 2025", risk: "Low", tone: "clinical" as const },
  { name: "Arthur Holloway", id: "MQ-2018", age: 68, last: "Oct 12, 2025", risk: "High", tone: "danger" as const },
  { name: "Daniel Ortiz", id: "MQ-2044", age: 49, last: "Oct 14, 2025", risk: "Moderate", tone: "warn" as const },
  { name: "Priya Rao", id: "MQ-1995", age: 27, last: "Oct 09, 2025", risk: "Low", tone: "clinical" as const },
];

function Patients() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient roster</h1>
          <p className="text-muted-foreground mt-2">Patients under your active care.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
          <Search className="size-4 text-muted-foreground" />
          <input placeholder="Search patients…" className="bg-transparent outline-none text-sm w-56" />
        </div>
      </header>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Age</th>
              <th className="px-6 py-4">Last visit</th>
              <th className="px-6 py-4">Risk</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center text-[11px] font-bold">
                      {r.name.split(" ").map((s) => s[0]).join("")}
                    </div>
                    <span className="text-sm font-semibold">{r.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{r.id}</td>
                <td className="px-6 py-4 text-sm">{r.age}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{r.last}</td>
                <td className="px-6 py-4"><Pill tone={r.tone}>{r.risk}</Pill></td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-semibold text-brand hover:underline">Open chart</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
