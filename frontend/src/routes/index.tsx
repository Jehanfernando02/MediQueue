import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, ArrowRight, ShieldCheck, Activity, CalendarCheck, Sparkles, MoveRight } from "lucide-react";
import { useAuth, homeForRole } from "@/lib/auth";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediQueue — Clinical Appointment & Patient Flow" },
      { name: "description", content: "A premium operating system for clinics: appointments, live queues, doctor and admin dashboards." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: homeForRole(user.role) });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background dot-grid selection:bg-brand/30 overflow-hidden">

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-brand/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-clinical/10 blur-[120px] rounded-full animate-pulse" />

      <header className="max-w-7xl mx-auto px-6 lg:px-10 h-24 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-brand text-brand-foreground grid place-items-center shadow-2xl shadow-brand/20 shimmer-sweep">
            <Heart className="size-6" strokeWidth={3} />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tighter text-foreground">MediQueue</div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Clinical OS</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-[10px] uppercase tracking-widest font-black text-muted-foreground">
          <a href="#features" className="hover:text-brand transition-colors">Product</a>
          <a href="#teams" className="hover:text-brand transition-colors">For teams</a>
          <a href="#security" className="hover:text-brand transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-brand transition-colors">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-2xl bg-brand text-brand-foreground px-6 py-3 text-[10px] uppercase tracking-widest font-black shadow-2xl shadow-brand/30 hover:scale-105 transition-all shimmer-sweep"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 lg:pt-32 pb-32 grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="stagger-in" style={{ "--delay": "0.1s" } as any}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-brand mb-8 shadow-sm">
            <Sparkles className="size-3.5" />
            Modern Clinical Excellence
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-foreground">
            The OS for <br />
            <span className="text-gradient">Modern Clinics.</span>
          </h1>
          <p className="mt-10 text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
            MediQueue replaces chaotic paper trails and legacy software with a calm, high-performance view of your entire clinical practice.
          </p>
          <div className="mt-12 flex flex-wrap gap-5">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-2xl bg-brand text-brand-foreground px-8 py-4 text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/40 hover:scale-105 transition-all shimmer-sweep"
            >
              Start Free Trial <MoveRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card/40 backdrop-blur-md px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-muted transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-16 flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
            <div className="flex items-center gap-2"><Activity className="size-4 text-clinical" /> REAL-TIME QUEUE</div>
            <div className="flex items-center gap-2"><CalendarCheck className="size-4 text-clinical" /> SMART SLOTS</div>
          </div>
        </div>

        <div className="relative stagger-in" style={{ "--delay": "0.3s" } as any}>
          <div className="absolute -inset-10 bg-gradient-to-tr from-brand/20 to-clinical/20 blur-[100px] rounded-[60px] animate-pulse" />

          <div className="relative glass-card rounded-[2.5rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-white/20 transform perspective-[1000px] rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-brand to-clinical" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Clinic Status</div>
                <div className="text-2xl font-black tracking-tighter">St. Jude Medical Center</div>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-clinical/10 text-clinical text-[10px] font-black uppercase tracking-widest shadow-sm">
                <span className="size-2 rounded-full bg-clinical pulse-dot" /> Live Dashboard
              </span>
            </div>

            <div className="space-y-4">
              {[
                { n: "Sarah Jenkins", t: "09:15", s: "Consulting", tone: "clinical" },
                { n: "Marcus Lewis", t: "09:40", s: "Arrived", tone: "brand" },
                { n: "Elena Halloway", t: "10:05", s: "Scheduled", tone: "muted" },
              ].map((r, i) => (
                <div key={r.n} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm transition-all hover:bg-white/10 group/item">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-black text-sm shadow-lg group-hover/item:scale-110 transition-transform">
                    {r.n.split(" ").map((s) => s[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold truncate">{r.n}</div>
                    <div className="text-xs text-muted-foreground font-medium">Room 304 • Cardiology</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-muted-foreground/60">{r.t}</div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm",
                    r.tone === "clinical" ? "bg-clinical/10 text-clinical border-clinical/20"
                      : r.tone === "brand" ? "bg-brand/10 text-brand border-brand/20"
                        : "bg-muted text-muted-foreground border-border"
                  )}>{r.s}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { l: "Patients Today", v: "142", t: "brand" },
                { l: "Avg. Wait", v: "14m", t: "clinical" },
                { l: "Efficiency", v: "94%", t: "default" },
              ].map((s) => (
                <div key={s.l} className="rounded-3xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.l}</div>
                  <div className={cn("text-2xl font-black tracking-tighter", s.t === 'brand' ? 'text-brand' : s.t === 'clinical' ? 'text-clinical' : 'text-foreground')}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border relative z-10 bg-background/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-3">
            <Heart className="size-4 text-brand" />
            <span>© {new Date().getFullYear()} MediQueue, Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-10">
            <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand transition-colors">Contact Sales</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
