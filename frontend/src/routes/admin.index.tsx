import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard, StatCard, Pill } from "@/components/ui/glass";
import {
  Users, CalendarCheck, Activity, TrendingUp, ArrowUpRight, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — MediQueue" }] }),
  component: AdminHome,
});

const AREA = [
  { d: "Mon", v: 120 }, { d: "Tue", v: 142 }, { d: "Wed", v: 138 },
  { d: "Thu", v: 165 }, { d: "Fri", v: 158 }, { d: "Sat", v: 92 }, { d: "Sun", v: 64 },
];
const BAR = [
  { d: "Cardio", v: 58 }, { d: "Derm", v: 42 }, { d: "Peds", v: 75 },
  { d: "Neuro", v: 28 }, { d: "Ortho", v: 39 }, { d: "GP", v: 84 },
];

function AdminHome() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">System overview</h1>
          <p className="text-muted-foreground mt-2">Tuesday, October 14 • 6 departments • 24 active doctors</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/reports" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-sm font-semibold hover:bg-muted">
            <FileText className="size-4" /> Generate report
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Patients today" value="142" hint={<span className="inline-flex items-center gap-1 text-clinical font-semibold"><ArrowUpRight className="size-3" /> +12% vs avg</span>} icon={<Users className="size-4 text-brand" />} />
        <StatCard label="Appointments" value="218" hint="86% booked" tone="brand" icon={<CalendarCheck className="size-4 text-brand" />} />
        <StatCard label="Avg wait" value="14m" hint="Within target" tone="clinical" icon={<Activity className="size-4 text-clinical" />} />
        <StatCard label="Satisfaction" value="4.9" hint="From 312 reviews" tone="clinical" icon={<TrendingUp className="size-4 text-clinical" />} />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Patient volume</div>
              <h3 className="text-lg font-bold mt-1">This week</h3>
            </div>
            <Pill tone="clinical">+8.2% WoW</Pill>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AREA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.22 262)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.22 262)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                <XAxis dataKey="d" stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 250)", fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.55 0.22 262)" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-foreground text-background border-none">
          <div className="text-[10px] uppercase tracking-widest font-bold text-background/60">Efficiency Score</div>
          <div className="flex items-end gap-3 mt-3">
            <span className="text-5xl font-bold tracking-tight">98.4</span>
            <span className="text-sm text-clinical mb-1.5 font-semibold">+2.1%</span>
          </div>
          <div className="h-px bg-background/10 my-6" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-background/60">New patients</div>
              <div className="text-xl font-bold mt-1">1,240</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-background/60">Revenue</div>
              <div className="text-xl font-bold mt-1">$42k</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-background/60">No-shows</div>
              <div className="text-xl font-bold mt-1">3.2%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-background/60">Cancellations</div>
              <div className="text-xl font-bold mt-1">5.8%</div>
            </div>
          </div>
          <Link to="/admin/reports" className="block mt-6 w-full py-3 rounded-2xl bg-brand text-brand-foreground text-center text-xs font-bold">
            Generate audit report
          </Link>
        </GlassCard>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Department load</div>
              <h3 className="text-lg font-bold mt-1">Visits by specialty</h3>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                <XAxis dataKey="d" stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 250)", fontSize: 12 }} />
                <Bar dataKey="v" fill="oklch(0.7 0.15 165)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-5">Recent activity</h3>
          <div className="relative space-y-5">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
            {[
              { t: "Slot cancelled", d: "Patient #4402 • 12:40 PM", color: "bg-brand" },
              { t: "Prescription issued", d: "Dr. Thorne for Julianna V.", color: "bg-clinical" },
              { t: "Doctor onboarded", d: "Dr. Sarah Chen • Pediatrics", color: "bg-warn" },
              { t: "Department updated", d: "Cardiology hours extended", color: "bg-muted-foreground" },
            ].map((x, i) => (
              <div key={i} className="relative pl-7">
                <div className={["absolute left-0 top-1.5 size-5 rounded-full border-4 border-background", x.color].join(" ")} />
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="text-xs text-muted-foreground">{x.d}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
