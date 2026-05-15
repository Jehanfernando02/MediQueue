import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, Pill, StatCard } from "@/components/ui/glass";
import { Activity, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/patient/queue")({
  head: () => ({ meta: [{ title: "Live queue — MediQueue" }] }),
  component: Queue,
});

function Queue() {
  const [position, setPosition] = useState(3);
  const [eta, setEta] = useState(14);

  useEffect(() => {
    const id = setInterval(() => {
      setEta((e) => Math.max(1, e - 1));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Live queue tracker</h1>
        <p className="text-muted-foreground mt-2">Real-time updates from St. Jude Medical Center.</p>
      </header>

      <GlassCard className="p-8 bg-gradient-to-br from-brand to-clinical text-white border-none relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.2),transparent_60%)]" />
        <div className="relative">
          <Pill tone="brand" className="!bg-white/20 !text-white">
            <span className="size-1.5 rounded-full bg-white pulse-dot" /> Live
          </Pill>
          <div className="mt-6 grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Your position</div>
              <div className="text-6xl font-bold tracking-tight mt-2">#{position}</div>
              <div className="text-sm text-white/80 mt-1">in line for Dr. Thorne</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Estimated wait</div>
              <div className="text-6xl font-bold tracking-tight mt-2">{eta}<span className="text-2xl font-normal text-white/80 ml-1">min</span></div>
              <div className="text-sm text-white/80 mt-1">Updated just now</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70 font-bold">Room</div>
              <div className="text-6xl font-bold tracking-tight mt-2">304</div>
              <div className="text-sm text-white/80 mt-1 flex items-center gap-1.5"><MapPin className="size-3.5" /> 3rd floor, west wing</div>
            </div>
          </div>
          <button onClick={() => setPosition(Math.max(1, position - 1))} className="mt-8 px-5 py-2.5 rounded-full bg-white text-brand text-sm font-semibold hover:scale-105 transition-transform">
            Refresh status
          </button>
        </div>
      </GlassCard>

      <section className="grid md:grid-cols-3 gap-4">
        <StatCard label="Patients ahead" value={position - 1} icon={<Activity className="size-4 text-brand" />} />
        <StatCard label="Avg consult time" value="12m" tone="clinical" />
        <StatCard label="On-time rate" value="94%" tone="brand" />
      </section>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold mb-5">Queue progression</h3>
        <div className="space-y-3">
          {[
            { n: "Sarah Jenkins", s: "In progress", tone: "clinical" as const, t: "since 09:15" },
            { n: "Marcus Lewis", s: "Up next", tone: "brand" as const, t: "ready" },
            { n: "Elena Halloway", s: "Waiting", tone: "muted" as const, t: "ETA 12m" },
            { n: "You", s: "Waiting", tone: "warn" as const, t: `ETA ${eta}m`, you: true },
            { n: "Daniel Ortiz", s: "Waiting", tone: "muted" as const, t: "ETA 22m" },
          ].map((p, i) => (
            <div key={i} className={[
              "flex items-center gap-4 p-3 rounded-2xl border",
              p.you ? "border-brand/40 bg-brand-soft" : "border-transparent bg-muted/40",
            ].join(" ")}>
              <div className="size-8 rounded-full grid place-items-center text-xs font-bold bg-card border border-border">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-2">{p.n}{p.you && <Pill tone="brand">You</Pill>}</div>
                <div className="text-xs text-muted-foreground">{p.t}</div>
              </div>
              <Pill tone={p.tone} dot={p.tone === "clinical"}>{p.s}</Pill>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
