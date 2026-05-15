import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, ArrowRight, ShieldCheck, Activity, CalendarCheck, Sparkles } from "lucide-react";
import { useAuth, homeForRole } from "@/lib/auth";
import { useEffect } from "react";

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
    <div className="min-h-screen soft-gradient">
      <header className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand text-brand-foreground grid place-items-center shadow-lg shadow-brand/25">
            <Heart className="size-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">MediQueue</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical OS</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Product</a>
          <a href="#roles" className="hover:text-foreground transition-colors">For teams</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold shadow-lg shadow-brand/25 hover:scale-105 transition-transform"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 lg:pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" />
            Built for hospital-grade workflows
          </div>
          <h1 className="mt-5 text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            The operating system for{" "}
            <span className="bg-gradient-to-r from-brand to-clinical bg-clip-text text-transparent">
              modern clinics
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            MediQueue replaces clipboards and call-back lists with a calm, real-time
            view of every appointment, patient and doctor in your clinic.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground px-6 py-3 text-sm font-semibold shadow-xl shadow-brand/25 hover:scale-105 transition-transform"
            >
              Start free trial <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-6 py-3 text-sm font-semibold hover:bg-card transition-colors"
            >
              Explore demo
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-clinical" /> HIPAA-ready</div>
            <div className="flex items-center gap-2"><Activity className="size-4 text-clinical" /> Real-time queue</div>
            <div className="flex items-center gap-2"><CalendarCheck className="size-4 text-clinical" /> Smart scheduling</div>
          </div>
        </div>

        <div className="relative fade-in">
          <div className="absolute -inset-6 bg-gradient-to-tr from-brand/20 to-clinical/20 blur-3xl rounded-[40px]" />
          <div className="relative glass-card rounded-3xl p-6 shadow-2xl shadow-brand/10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's queue</div>
                <div className="text-lg font-bold">St. Jude Medical • Cardiology</div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clinical-soft text-clinical text-[10px] font-bold uppercase">
                <span className="size-1.5 rounded-full bg-clinical pulse-dot" /> Live
              </span>
            </div>
            <div className="space-y-3">
              {[
                { n: "Sarah Jenkins", t: "09:15", s: "In progress", tone: "clinical" },
                { n: "Marcus Lewis", t: "09:40", s: "Arrived", tone: "brand" },
                { n: "Elena Halloway", t: "10:05", s: "Scheduled", tone: "muted" },
              ].map((r) => (
                <div key={r.n} className="flex items-center gap-4 p-3 rounded-2xl bg-background/60 border border-border">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-xs">
                    {r.n.split(" ").map((s) => s[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.n}</div>
                    <div className="text-xs text-muted-foreground">Room 304 • Dr. Thorne</div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{r.t}</div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full
                    ${r.tone === "clinical" ? "bg-clinical-soft text-clinical"
                      : r.tone === "brand" ? "bg-brand-soft text-brand"
                      : "bg-muted text-muted-foreground"}`}>{r.s}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { l: "Patients", v: "142" },
                { l: "Avg wait", v: "14m" },
                { l: "On-time", v: "94%" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-border bg-background/40 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
                  <div className="text-xl font-bold mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MediQueue, Inc.</span>
          <span>Designed for hospitals that move fast.</span>
        </div>
      </footer>
    </div>
  );
}
