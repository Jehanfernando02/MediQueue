import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Search, Filter } from "lucide-react";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({ meta: [{ title: "All appointments — MediQueue" }] }),
  component: All,
});

interface Row { id: string; patient: string; doctor: string; spec: string; date: string; time: string; status: "Confirmed" | "Pending" | "Completed" | "Cancelled"; }
const ROWS: Row[] = [
  { id: "AP-9001", patient: "Sarah Jenkins", doctor: "Dr. Thorne", spec: "Cardiology", date: "Oct 14", time: "09:30", status: "Confirmed" },
  { id: "AP-9002", patient: "Marcus Lewis", doctor: "Dr. Thorne", spec: "Cardiology", date: "Oct 14", time: "09:40", status: "Confirmed" },
  { id: "AP-9003", patient: "Elena Halloway", doctor: "Dr. Chen", spec: "Dermatology", date: "Oct 14", time: "10:05", status: "Pending" },
  { id: "AP-9004", patient: "Daniel Ortiz", doctor: "Dr. Lee", spec: "Pediatrics", date: "Oct 14", time: "11:15", status: "Confirmed" },
  { id: "AP-9005", patient: "Arthur Holloway", doctor: "Dr. Thorne", spec: "Cardiology", date: "Oct 12", time: "14:30", status: "Completed" },
  { id: "AP-9006", patient: "Priya Rao", doctor: "Dr. Frost", spec: "Orthopedics", date: "Oct 11", time: "16:00", status: "Cancelled" },
  { id: "AP-9007", patient: "Julianna Vance", doctor: "Dr. Thorne", spec: "Cardiology", date: "Oct 10", time: "10:45", status: "Completed" },
];

const TONES = { Confirmed: "brand", Pending: "warn", Completed: "clinical", Cancelled: "danger" } as const;

function All() {
  const [filter, setFilter] = useState<"All" | Row["status"]>("All");
  const [q, setQ] = useState("");
  const filtered = ROWS.filter((r) => (filter === "All" || r.status === filter) && (r.patient.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All appointments</h1>
          <p className="text-muted-foreground mt-2">Search, filter and manage every visit across the clinic.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Search className="size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient or ID…" className="bg-transparent outline-none text-sm w-56" />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold">
            <Filter className="size-4" /> Filters
          </button>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {(["All", "Confirmed", "Pending", "Completed", "Cancelled"] as const).map((s) => (
          <button
            key={s} onClick={() => setFilter(s)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === s ? "bg-brand text-brand-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {s}
          </button>
        ))}
      </div>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Specialty</th>
              <th className="px-6 py-4">When</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{r.id}</td>
                <td className="px-6 py-4 text-sm font-semibold">{r.patient}</td>
                <td className="px-6 py-4 text-sm">{r.doctor}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{r.spec}</td>
                <td className="px-6 py-4 text-sm font-mono">{r.date} • {r.time}</td>
                <td className="px-6 py-4"><Pill tone={TONES[r.status]}>{r.status}</Pill></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">No appointments match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
