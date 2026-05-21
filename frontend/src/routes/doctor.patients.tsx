import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Search, User, Loader2, ExternalLink } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorPatientsThunk } from "@/thunks/doctorThunks";
import { selectMyPatients, selectDoctorStatus } from "@/store/slices/doctorSlice";

export const Route = createFileRoute("/doctor/patients")({
  head: () => ({ meta: [{ title: "Patient roster — MediQueue" }] }),
  component: Patients,
});

function Patients() {
  const dispatch = useAppDispatch();
  const patients = useAppSelector(selectMyPatients);
  const status = useAppSelector(selectDoctorStatus);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchDoctorPatientsThunk());
  }, [dispatch]);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const loading = status === "loading" && patients.length === 0;

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient roster</h1>
          <p className="text-muted-foreground mt-2">Patients who have consulted with you.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
          <Search className="size-4 text-muted-foreground" />
          <input 
            placeholder="Search patients…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-56" 
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-brand" />
          <span className="text-sm">Retrieving your patient roster…</span>
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Age / Info</th>
                <th className="px-6 py-4">Last visit</th>
                <th className="px-6 py-4">Risk</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center text-[11px] font-bold">
                        {getInitials(r.name)}
                      </div>
                      <span className="text-sm font-semibold">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{r.email}</td>
                  <td className="px-6 py-4 text-sm">{r.age || "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {r.last_visit ? new Date(r.last_visit).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <Pill tone={r.risk_score === "High" ? "danger" : r.risk_score === "Moderate" ? "warn" : "clinical"}>
                      {r.risk_score || "Unrated"}
                    </Pill>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                      Open chart <ExternalLink className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-muted-foreground">
                    <User className="size-10 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No patients found.</p>
                    <p className="text-xs mt-1">Your roster will populate as you complete consultations.</p>
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
