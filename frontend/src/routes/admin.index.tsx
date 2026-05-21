import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, StatCard, Pill } from "@/components/ui/glass";
import {
  Users, CalendarCheck, Activity, TrendingUp, ArrowUpRight, FileText, Loader2, RefreshCw,
  Sparkles, ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorsThunk } from "@/thunks/doctorThunks";
import { fetchDepartmentsThunk } from "@/thunks/departmentThunks";
import { fetchAllAppointmentsThunk } from "@/thunks/appointmentThunks";
import { fetchAdminOverviewThunk, fetchDeptLoadThunk } from "@/thunks/adminThunks";
import { selectDoctors } from "@/store/slices/doctorSlice";
import { selectDepartments } from "@/store/slices/departmentSlice";
import { selectMyAppointments, selectAppointmentStatus } from "@/store/slices/appointmentSlice";
import { selectAdminOverview, selectDeptLoad, selectAdminStatus } from "@/store/slices/adminSlice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — MediQueue" }] }),
  component: AdminHome,
});

function AdminHome() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(selectDoctors);
  const departments = useAppSelector(selectDepartments);
  const appointments = useAppSelector(selectMyAppointments);
  const overview = useAppSelector(selectAdminOverview);
  const deptLoad = useAppSelector(selectDeptLoad);
  const status = useAppSelector(selectAdminStatus);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDoctorsThunk()),
      dispatch(fetchDepartmentsThunk()),
      dispatch(fetchAllAppointmentsThunk()),
      dispatch(fetchAdminOverviewThunk()),
      dispatch(fetchDeptLoadThunk()),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loading = (status === "loading" || !overview) && appointments.length === 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const areaData = last7Days.map(date => ({
    d: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    v: appointments.filter(a => a.date === date).length
  }));

  const barData = deptLoad.map(d => ({
    d: d.department.slice(0, 5),
    v: d.count
  }));

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-10 selection:bg-brand/30">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 stagger-in" style={{ "--delay": "0.1s" } as any}>
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-4 border border-brand/20 shadow-sm">
            <ShieldAlert className="size-3" /> System Control Plane
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">System Overview</h1>
          <p className="text-muted-foreground mt-3 font-medium text-lg">
            {today} • <span className="text-foreground/80">{departments.length} departments active</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-card/60 backdrop-blur-md text-xs font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={cn("size-4 text-brand", refreshing && "animate-spin")} />
            Refresh
          </button>
          <Link to="/admin/reports" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-brand text-brand-foreground text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/40 hover:scale-105 transition-all shimmer-sweep">
            <FileText className="size-4" /> Generate report
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
           <Loader2 className="size-10 animate-spin text-brand" />
           <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Initializing core systems…</span>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger-in" style={{ "--delay": "0.2s" } as any}>
            <StatCard label="Live Patients" value={String(overview?.patients_today ?? 0)} hint={<span className="inline-flex items-center gap-1 text-clinical font-black uppercase tracking-widest text-[9px]"><ArrowUpRight className="size-3" /> Active Now</span>} icon={<Users className="size-5" />} tone="default" />
            <StatCard label="Global Volume" value={String(appointments.length)} hint="Total appointments" tone="brand" icon={<CalendarCheck className="size-5" />} />
            <StatCard label="Unit Load" value={String(departments.length)} hint="Operational units" tone="clinical" icon={<Activity className="size-5" />} />
            <StatCard label="Core Teams" value={String(doctors.length)} hint={`${overview?.active_doctors ?? 0} online`} tone="clinical" icon={<TrendingUp className="size-5" />} />
          </section>

          <section className="grid lg:grid-cols-3 gap-8 stagger-in" style={{ "--delay": "0.3s" } as any}>
            <GlassCard className="p-8 lg:col-span-2">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Clinic Performance</div>
                  <h3 className="text-2xl font-black tracking-tighter">7-Day Patient Volume</h3>
                </div>
                <Pill tone="clinical" icon={<Sparkles className="size-3" />}>Real-time metrics</Pill>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.50 0.24 275)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.50 0.24 275)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="d" stroke="oklch(0.55 0.02 256)" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="oklch(0.55 0.02 256)" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 24, 
                        border: "1px solid oklch(0.92 0.01 250)", 
                        background: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(12px)",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Area type="monotone" dataKey="v" stroke="oklch(0.50 0.24 275)" strokeWidth={4} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-clinical" />
               <div className="absolute -top-20 -right-20 size-60 bg-brand/5 blur-[80px] rounded-full" />
               
              <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-6 flex items-center gap-2">
                 <Activity className="size-3 text-brand" /> System Core Health
              </div>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative size-40 grid place-items-center">
                   <svg className="size-full -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-muted fill-none" strokeWidth="12" />
                      <circle cx="80" cy="80" r="70" className="stroke-brand fill-none transition-all duration-1000 ease-out" strokeWidth="12" strokeLinecap="round" strokeDasharray="440" strokeDashoffset={440 - (440 * 0.98)} />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black tracking-tighter text-foreground">{overview?.system_health ?? '98%'}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Optimal</span>
                   </div>
                </div>
              </div>
              
              <div className="h-px bg-border/60 my-8" />
              
              <div className="grid grid-cols-2 gap-8 text-sm">
                {Object.entries(overview?.status_summary ?? { "Sessions": 12, "Alerts": 0 }).map(([status, count]) => (
                  <div key={status}>
                    <div className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1">{status.replace('_', ' ')}</div>
                    <div className="text-2xl font-black mt-1 tracking-tighter text-foreground">{count}</div>
                  </div>
                ))}
              </div>
              
              <Link to="/admin/reports" className="block mt-10 w-full py-4 rounded-2xl bg-brand text-brand-foreground text-center text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/40 hover:scale-[1.02] transition-all shimmer-sweep">
                Generate Analytics Report
              </Link>
            </GlassCard>
          </section>

          <section className="grid lg:grid-cols-3 gap-8 stagger-in" style={{ "--delay": "0.4s" } as any}>
            <GlassCard className="p-8 lg:col-span-2">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Operational Density</div>
                  <h3 className="text-2xl font-black tracking-tighter">Departmental Allocation</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
                    <XAxis dataKey="d" stroke="oklch(0.55 0.02 256)" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="oklch(0.55 0.02 256)" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                    <Tooltip 
                       contentStyle={{ 
                        borderRadius: 24, 
                        border: "1px solid oklch(0.92 0.01 250)", 
                        background: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(12px)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                    <Bar dataKey="v" fill="oklch(0.7 0.15 165)" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black tracking-tighter uppercase">Global Activity</h3>
                 <div className="size-2 rounded-full bg-clinical animate-pulse" />
              </div>
              <div className="relative space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border" />
                {appointments.slice(0, 5).map((appt, i) => {
                   const isCancelled = appt.status === 'cancelled';
                   return (
                    <div key={appt.id} className="relative pl-10 group cursor-default">
                      <div className={cn(
                        "absolute left-0 top-1.5 size-6 rounded-full border-4 border-background shadow-sm transition-transform group-hover:scale-125 z-10", 
                        isCancelled ? 'bg-brand' : 'bg-clinical'
                      )} />
                      <div className="text-sm font-black tracking-tight text-foreground/80">{isCancelled ? 'Event: Appointment Nullified' : 'Event: New Intake Recorded'}</div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-1 opacity-60 uppercase tracking-widest">{new Date(appt.created_at).toLocaleString()}</div>
                    </div>
                   )
                })}
                {appointments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                     <Activity className="size-8 mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No activity log found.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </section>
        </>
      )}
    </div>
  );
}
