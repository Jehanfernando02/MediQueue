import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Sparkles, Heart, Stethoscope, Shield, ArrowRight } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/store/slices/authSlice";

export default function DemoWelcomeModal() {
  const user = useAppSelector(selectAuthUser);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show if user is demo, and sessionStorage has 'demo_welcome_triggered' set to 'true'
    const isDemoUser = user?.email?.endsWith("@demo.mediqueue.org");
    if (!isDemoUser) return;

    if (typeof window !== "undefined") {
      const triggered = sessionStorage.getItem("mediqueue.demo_welcome_triggered");
      if (triggered === "true") {
        setOpen(true);
      }
    }
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      // Mark as shown so it doesn't open again during the same active session
      sessionStorage.setItem("mediqueue.demo_welcome_triggered", "completed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[2.5rem] border border-slate-800 shadow-[0_32px_64px_rgba(0,0,0,0.6)] bg-slate-950 text-white max-w-lg overflow-hidden p-8">
        {/* Glow Line Accent */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-brand via-clinical to-brand" />

        <DialogHeader className="items-center text-center">
          <div className="size-16 rounded-3xl bg-brand text-brand-foreground grid place-items-center mb-4 shadow-2xl shadow-brand/40 shimmer-sweep">
            <Sparkles className="size-8" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-white">
            Welcome to the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-clinical">Interactive Clinical Tour!</span>
          </DialogTitle>
          <DialogDescription className="text-slate-200 text-xs font-semibold max-w-xs mt-3 leading-relaxed">
            MediQueue is a hospital-grade Clinical OS. Explore our pre-seeded, read-only showcase environment to see the platform's full capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand text-center mb-3">
            YOUR 3-STEP SHOWCASE GUIDE
          </div>

          {[
            {
              step: "01",
              title: "Patient Dashboard Portal",
              desc: "Explore self-service appointment scheduling, queue wait times, and active notifications.",
              icon: Heart,
              color: "text-brand bg-brand/10 border-brand/20",
            },
            {
              step: "02",
              title: "Doctor Flow OS Console",
              desc: "Inspect live waiting lists, clinical status logs, weekly schedules, and consultation notes.",
              icon: Stethoscope,
              color: "text-clinical bg-clinical/10 border-clinical/20",
            },
            {
              step: "03",
              title: "Admin Control Analytics",
              desc: "Review clinic operational dashboards, department details, and the immutable audit log timeline.",
              icon: Shield,
              color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10"
              >
                <div className="text-xs font-black text-slate-300 uppercase tracking-widest shrink-0">
                  {item.step}
                </div>
                <div className={`size-10 rounded-xl border grid place-items-center shrink-0 ${item.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white">{item.title}</h4>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-8">
          <button
            onClick={handleClose}
            className="w-full py-4 rounded-2xl bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-brand/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start System Showcase <ArrowRight className="size-4" />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
