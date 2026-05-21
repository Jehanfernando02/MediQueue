import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Search, Filter, Loader2, Calendar } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllAppointmentsThunk } from "@/thunks/appointmentThunks";
import { selectAllAppointments, selectAppointmentStatus } from "@/store/slices/appointmentSlice";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({ meta: [{ title: "All appointments — MediQueue" }] }),
  component: AllAppointmentsPage,
});

const TONES = { 
  scheduled: "brand", 
  arrived: "brand",
  in_progress: "clinical", 
  done: "clinical", 
  cancelled: "danger",
  no_show: "muted"
} as const;

function AllAppointmentsPage() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectAllAppointments);
  const status = useAppSelector(selectAppointmentStatus);

  const [filter, setFilter] = useState<string>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchAllAppointmentsThunk());
  }, [dispatch]);

  const filtered = appointments.filter((r) => {
    const matchesFilter = filter === "All" || r.status === filter;
    const matchesQuery = (r.patient_name?.toLowerCase().includes(q.toLowerCase()) || 
                          r.id.toLowerCase().includes(q.toLowerCase()) ||
                          r.doctor_name?.toLowerCase().includes(q.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const loading = status === "loading" && appointments.length === 0;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (iso: string) => {
    const raw = iso.includes("T") ? iso.split("T")[1] : iso;
    const [h, m] = raw.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System appointments</h1>
          <p className="text-muted-foreground mt-2">Global view of every visit across the clinic network.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border focus-within:border-brand/50 transition-colors">
            <Search className="size-4 text-muted-foreground" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search appointments…" 
              className="bg-transparent outline-none text-sm w-56" 
            />
          </div>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {(["All", "scheduled", "arrived", "in_progress", "done", "cancelled", "no_show"] as const).map((s) => (
          <button
            key={s} onClick={() => setFilter(s)}
            className={[
              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
              filter === s ? "bg-brand text-brand-foreground shadow-lg shadow-brand/20" : "bg-card border border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {s === "All" ? "All Status" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-brand" />
          <span className="text-sm font-medium">Synchronizing system records…</span>
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor / Specialty</th>
                <th className="px-6 py-4">When</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 text-[11px] font-mono text-muted-foreground">
                    #{r.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">{r.patient_name || "Unknown Patient"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{r.patient_id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{r.doctor_name || "Doctor"}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{r.specialty || "General"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">{formatDate(r.date)}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{formatTime(r.start_time)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Pill tone={TONES[r.status] || "muted"}>
                      {r.status.replace("_", " ")}
                    </Pill>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground italic">
                    <Calendar className="size-10 mx-auto mb-4 opacity-20" />
                    No appointments match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
