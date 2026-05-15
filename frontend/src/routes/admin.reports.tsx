import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, StatCard } from "@/components/ui/glass";
import { Download, FileText } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — MediQueue" }] }),
  component: Reports,
});

const TREND = Array.from({ length: 12 }, (_, i) => ({
  m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  visits: 600 + Math.round(Math.sin(i / 1.5) * 120 + i * 18),
  revenue: 28 + Math.round(Math.cos(i / 1.7) * 6 + i * 0.7),
}));

const PIE = [
  { name: "Cardiology", value: 28, color: "oklch(0.55 0.22 262)" },
  { name: "Pediatrics", value: 22, color: "oklch(0.7 0.15 165)" },
  { name: "Dermatology", value: 14, color: "oklch(0.78 0.13 90)" },
  { name: "Neurology", value: 9, color: "oklch(0.62 0.18 200)" },
  { name: "Other", value: 27, color: "oklch(0.7 0.02 256)" },
];

function Reports() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">Performance and revenue insights across your clinic.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25">
          <Download className="size-4" /> Export PDF
        </button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MTD revenue" value="$486k" hint="+12.4% MoM" tone="brand" />
        <StatCard label="Visits" value="3,214" hint="vs 2,894 last month" tone="clinical" />
        <StatCard label="No-show rate" value="3.2%" hint="–0.4 pts" tone="clinical" />
        <StatCard label="NPS" value="+74" hint="Top quartile" tone="brand" />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="text-lg font-bold">Visits & revenue trend</h3>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                <XAxis dataKey="m" stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 250)", fontSize: 12 }} />
                <Line type="monotone" dataKey="visits" stroke="oklch(0.55 0.22 262)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.7 0.15 165)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold">Visit mix</h3>
          <p className="text-xs text-muted-foreground">By specialty</p>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {PIE.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 250)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { t: "Weekly operations report", d: "Volume, wait times and capacity for the past week." },
          { t: "Doctor performance", d: "Per-doctor consult counts and patient feedback." },
          { t: "Financial summary", d: "Revenue, billing and outstanding invoices." },
        ].map((c) => (
          <GlassCard hover key={c.t} className="p-5">
            <div className="size-10 rounded-2xl bg-brand-soft text-brand grid place-items-center mb-4">
              <FileText className="size-5" />
            </div>
            <h4 className="font-semibold">{c.t}</h4>
            <p className="text-xs text-muted-foreground mt-1">{c.d}</p>
            <button className="mt-4 text-xs font-semibold text-brand">Download →</button>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
