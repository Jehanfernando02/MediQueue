import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GlassCard, StatCard } from "@/components/ui/glass";
import { Download, FileText, Loader2, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminOverviewThunk, fetchDeptLoadThunk, fetchTrendsThunk, exportReportThunk } from "@/thunks/adminThunks";
import { selectAdminOverview, selectDeptLoad, selectAdminStatus, selectTrends } from "@/store/slices/adminSlice";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — MediQueue" }] }),
  component: Reports,
});

const COLORS = [
  "oklch(0.55 0.22 262)", // Indigo
  "oklch(0.7 0.15 165)",  // Emerald
  "oklch(0.78 0.13 90)",   // Amber
  "oklch(0.62 0.18 200)",  // Sky
  "oklch(0.7 0.02 256)",   // Muted
];

function Reports() {
  const dispatch = useAppDispatch();
  const overview = useAppSelector(selectAdminOverview);
  const deptLoad = useAppSelector(selectDeptLoad);
  const trends = useAppSelector(selectTrends);
  const status = useAppSelector(selectAdminStatus);

  useEffect(() => {
    dispatch(fetchAdminOverviewThunk());
    dispatch(fetchDeptLoadThunk());
    dispatch(fetchTrendsThunk());
  }, [dispatch]);

  const loading = status === "loading" && !overview;

  // Transform deptLoad for PieChart
  const pieData = deptLoad.map((d, i) => ({
    name: d.department,
    value: d.count,
    color: COLORS[i % COLORS.length]
  }));

  const handleExport = () => {
    dispatch(exportReportThunk());
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-muted-foreground mt-2">Aggregate insights and operational capacity across the clinic network.</p>
        </div>
        <button 
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25"
        >
          <Download className="size-4" /> Export Report
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-brand" />
          <span className="text-lg font-medium">Analyzing system data…</span>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Patients today" 
              value={overview?.patients_today ?? "—"} 
              hint="Real-time volume" 
              tone="brand" 
            />
            <StatCard 
              label="Active doctors" 
              value={overview?.active_doctors ?? "—"} 
              hint="Current shifts" 
              tone="clinical" 
            />
            <StatCard 
              label="Confirmed" 
              value={overview?.status_summary?.scheduled ?? "0"} 
              hint="Pending visits" 
              tone="clinical" 
            />
            <StatCard 
              label="Health" 
              value={overview?.system_health ?? "Optimal"} 
              hint="Infrastructure" 
              tone="brand" 
            />
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 lg:col-span-2">
              <h3 className="text-lg font-bold">Operational trend</h3>
              <p className="text-xs text-muted-foreground">Volume vs Capacity (Last 6 months)</p>
              <div className="h-72 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="month" stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.55 0.02 256)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="visits" stroke="oklch(0.55 0.22 262)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.55 0.22 262)" }} />
                    <Line type="monotone" dataKey="load" stroke="oklch(0.7 0.15 165)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.7 0.15 165)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-bold">Department load</h3>
              <p className="text-xs text-muted-foreground">Distribution of current patient volume</p>
              {deptLoad.length > 0 ? (
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={4}>
                        {pieData.map((p, i) => <Cell key={i} fill={p.color} className="outline-none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <BarChart3 className="size-10 text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500">No department data available</p>
                </div>
              )}
            </GlassCard>
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { t: "Compliance report", d: "System access logs and data integrity audits." },
              { t: "Specialty performance", d: "Load balancing and doctor utilization per department." },
              { t: "Patient retention", d: "Revisit frequency and appointment fulfillment metrics." },
            ].map((c) => (
              <GlassCard hover key={c.t} className="p-6">
                <div className="size-12 rounded-2xl bg-brand/10 text-brand grid place-items-center mb-4 border border-brand/20">
                  <FileText className="size-5" />
                </div>
                <h4 className="font-bold">{c.t}</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.d}</p>
                <button 
                  onClick={handleExport}
                  className="mt-5 text-xs font-bold text-brand uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                >
                  Generate →
                </button>
              </GlassCard>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
