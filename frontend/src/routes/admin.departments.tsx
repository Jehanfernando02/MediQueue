import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/ui/glass";
import { Building2, Users, Stethoscope, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — MediQueue" }] }),
  component: Depts,
});

const DEPTS = [
  { name: "Cardiology", lead: "Dr. Aris Thorne", doctors: 6, patients: 412, load: 88, color: "from-brand to-clinical" },
  { name: "Dermatology", lead: "Dr. Sarah Chen", doctors: 4, patients: 198, load: 64, color: "from-clinical to-brand" },
  { name: "Pediatrics", lead: "Dr. Marcus Lee", doctors: 8, patients: 521, load: 91, color: "from-brand to-warn" },
  { name: "Neurology", lead: "Dr. Priya Rao", doctors: 3, patients: 96, load: 42, color: "from-clinical to-warn" },
  { name: "Orthopedics", lead: "Dr. Benjamin Frost", doctors: 5, patients: 244, load: 71, color: "from-warn to-brand" },
  { name: "General Practice", lead: "Dr. Helena Vasquez", doctors: 12, patients: 884, load: 78, color: "from-brand to-clinical" },
];

function Depts() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground mt-2">Capacity and ownership across your clinical organization.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEPTS.map((d) => (
          <GlassCard key={d.name} hover className="p-6">
            <div className="flex items-start justify-between">
              <div className={`size-12 rounded-2xl bg-gradient-to-br ${d.color} text-white grid place-items-center`}>
                <Building2 className="size-5" />
              </div>
              <button className="size-8 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted">
                <ArrowUpRight className="size-4" />
              </button>
            </div>
            <h3 className="mt-5 text-lg font-bold">{d.name}</h3>
            <p className="text-xs text-muted-foreground">Led by {d.lead}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground"><Stethoscope className="size-3" /> Doctors</div>
                <div className="text-xl font-bold mt-1">{d.doctors}</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground"><Users className="size-3" /> Patients</div>
                <div className="text-xl font-bold mt-1">{d.patients}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-semibold">{d.load}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${d.color}`} style={{ width: `${d.load}%` }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
