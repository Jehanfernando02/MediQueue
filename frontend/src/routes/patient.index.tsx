import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard, StatCard, Pill, SectionHeading } from "@/components/ui/glass";
import { CalendarPlus, Activity, ChevronRight, Clock, Heart, Pill as PillIcon, Stethoscope } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/patient/")({
  head: () => ({ meta: [{ title: "Patient overview — MediQueue" }] }),
  component: PatientHome,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function PatientHome() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {greeting()}, {user?.name.split(" ")[0]} <span aria-hidden>👋</span>
          </h1>
          <p className="text-muted-foreground mt-2">Your next appointment is in 2 days. Everything is on track.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/patient/book" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25 hover:scale-105 transition-transform">
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
          <Link to="/patient/queue" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-sm font-semibold hover:bg-muted">
            <Activity className="size-4" /> Live queue
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value="2" hint="In the next 14 days" tone="brand" />
        <StatCard label="Completed" value="18" hint="Last 12 months" />
        <StatCard label="Prescriptions" value="3" hint="2 refillable" tone="clinical" />
        <StatCard label="Care team" value="4" hint="Specialists you see" />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2">
          <SectionHeading
            title="Upcoming appointments"
            action={<Link to="/patient/appointments" className="text-xs font-semibold text-brand inline-flex items-center gap-1">View all <ChevronRight className="size-3.5" /></Link>}
          />
          <div className="space-y-3">
            {[
              { date: "Oct 14", doc: "Dr. Aris Thorne", spec: "Cardiology", time: "09:30 AM", status: "Confirmed", tone: "brand" as const },
              { date: "Oct 22", doc: "Dr. Sarah Chen", spec: "Dermatology", time: "02:15 PM", status: "Pending", tone: "warn" as const },
            ].map((a) => (
              <div key={a.date + a.time} className="group flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:bg-muted/60 hover:border-border transition-all">
                <div className="size-14 rounded-2xl bg-muted flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{a.date.split(" ")[0]}</span>
                  <span className="text-lg font-bold leading-none">{a.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{a.doc}</h4>
                  <p className="text-xs text-muted-foreground">{a.spec} • {a.time}</p>
                </div>
                <Pill tone={a.tone}>{a.status}</Pill>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-brand to-clinical text-white border-none">
          <Heart className="size-6 mb-3" />
          <h3 className="text-lg font-bold leading-tight">Your wellness pulse</h3>
          <p className="text-xs text-white/80 mt-1">Based on recent visits and lab results.</p>
          <div className="mt-6">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">92</span>
              <span className="text-sm text-white/80 mb-1">/ 100</span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-[92%]" />
            </div>
            <p className="text-xs text-white/80 mt-3">Excellent — keep up the consistent visits.</p>
          </div>
        </GlassCard>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <SectionHeading title="Active prescriptions" action={<button className="text-xs font-semibold text-brand">Request refill</button>} />
          <div className="space-y-3">
            {[
              { name: "Atorvastatin 20mg", doctor: "Dr. Thorne", left: "12 days left" },
              { name: "Vitamin D3", doctor: "Dr. Chen", left: "Ongoing" },
              { name: "Lisinopril 10mg", doctor: "Dr. Thorne", left: "30 days left" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="size-9 rounded-xl bg-clinical-soft text-clinical grid place-items-center">
                  <PillIcon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.doctor}</div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="size-3" /> {p.left}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeading title="Your care team" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "Dr. Aris Thorne", s: "Cardiology" },
              { n: "Dr. Sarah Chen", s: "Dermatology" },
              { n: "Dr. Marcus Lee", s: "GP" },
              { n: "Dr. Priya Rao", s: "Endocrinology" },
            ].map((d) => (
              <div key={d.n} className="p-4 rounded-2xl border border-border hover:border-brand/40 transition-colors">
                <div className="size-10 rounded-full bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-xs mb-3">
                  {d.n.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="text-sm font-semibold leading-tight">{d.n}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Stethoscope className="size-3" /> {d.s}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
