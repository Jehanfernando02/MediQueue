import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart, Stethoscope, ShieldCheck, UserRound, ArrowRight, AlertCircle,
  Activity, Sparkles, CheckCircle2, Lock, Eye, EyeOff,
} from "lucide-react";
import { type Role, homeForRole } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectAuthError, clearError } from "@/store/slices/authSlice";
import { loginThunk } from "@/thunks/authThunks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediQueue" }] }),
  component: Login,
});

const ROLES: {
  id: Role;
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
    { id: "patient", title: "Patient", copy: "Book and track visits", icon: UserRound, color: "oklch(0.7 0.15 165)" },
    { id: "doctor", title: "Doctor", copy: "Manage daily queue", icon: Stethoscope, color: "oklch(0.50 0.24 275)" },
    { id: "admin", title: "Admin", copy: "Clinic operations", icon: ShieldCheck, color: "oklch(0.78 0.15 75)" },
  ];

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const apiError = useAppSelector(selectAuthError);

  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loading = status === "loading";

  useEffect(() => {
    if (apiError) dispatch(clearError());
  }, [email, password, role, dispatch, apiError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (result.success) {
      toast.success("Welcome back", { description: `Signed in as ${result.user.role}` });
      navigate({ to: homeForRole(result.user.role) });
    } else {
      toast.error("Sign in failed", { description: result.error ?? "Invalid email or password" });
    }
  };

  const onForgotSubmit = () => {
    setForgotOpen(false);
    toast.success("Reset link sent", { description: "If that email exists, check your inbox." });
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden selection:bg-brand/30">
      <div className="grid lg:grid-cols-2 flex-1 relative min-h-0">
        {/* Left panel - Premium Mesh Hero */}
        <div className="hidden lg:flex relative flex-col justify-between p-16 mesh-gradient noise-overlay text-white">
        <div className="relative z-20 flex items-center gap-3 stagger-in" style={{ "--delay": "0.1s" } as any}>
          <div className="size-12 rounded-2xl bg-white text-brand grid place-items-center shadow-2xl shadow-brand/40 shimmer-sweep">
            <Heart className="size-6" strokeWidth={3} />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tighter">MediQueue</div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Clinical OS</div>
          </div>
        </div>

        <div className="relative z-20 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest mb-8 stagger-in" style={{ "--delay": "0.2s" } as any}>
            <Sparkles className="size-3.5 text-clinical" />
            Trusted by 500+ Medical Centers
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-[0.9] stagger-in" style={{ "--delay": "0.3s" } as any}>
            The Operating System for <span className="text-white/60">Modern Clinics.</span>
          </h1>
          <p className="mt-8 text-lg font-medium text-white/80 leading-relaxed stagger-in" style={{ "--delay": "0.4s" } as any}>
            MediQueue replaces generic appointment forms with a calm, high-performance view of your clinical practice.
          </p>

          <div className="mt-12 flex items-center gap-8 stagger-in" style={{ "--delay": "0.5s" } as any}>
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="size-12 rounded-2xl border-4 border-brand bg-white/20 backdrop-blur-md overflow-hidden ring-4 ring-brand/20">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-black">99.8%</div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Uptime Reliability</div>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-40 stagger-in" style={{ "--delay": "0.6s" } as any}>
          <div>© {new Date().getFullYear()} MediQueue, Inc.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -right-20 size-80 bg-clinical/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 size-80 bg-brand/30 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* Right panel - Form area */}
      <div className="relative flex items-center justify-center p-6 lg:p-20 dot-grid bg-background">
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 stagger-in" style={{ "--delay": "0.1s" } as any}>
            <h2 className="text-4xl font-black tracking-tighter">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Elevate your practice. Choose your role to begin.</p>
          </div>

          <div className="glass-card p-8 stagger-in relative" style={{ "--delay": "0.2s" } as any}>
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-brand to-clinical opacity-80" />

            {/* Role Cards */}
            <div className="mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-3">
                {role ? "Role selected" : "Select your role to continue"}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 group relative overflow-hidden",
                        active
                          ? "border-brand bg-brand/5 shadow-lg shadow-brand/10 ring-2 ring-brand/20"
                          : "border-border bg-card/40 hover:border-brand/30 hover:bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "size-10 rounded-xl grid place-items-center transition-all",
                        active ? "bg-brand text-white shadow-lg" : "bg-muted text-muted-foreground group-hover:text-brand"
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-brand" : "text-muted-foreground")}>
                        {r.title}
                      </span>
                      {active && <div className="absolute top-0 right-0 p-1"><CheckCircle2 className="size-3 text-brand" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider shown only after role picked */}
            {role && <div className="border-t border-border my-6" />}

            {/* Fields only shown after role is selected */}
            {role && (
              <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                {/* Error banner */}
                {apiError && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-bold text-destructive animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="size-4 shrink-0" />
                    {apiError}
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Email address
                    </label>
                    <div className="relative group">
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@clinic.org"
                        className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-brand hover:opacity-70"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold placeholder:text-muted-foreground/40 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-brand transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-foreground text-sm font-black uppercase tracking-widest shadow-2xl shadow-brand/40 hover:opacity-95 disabled:opacity-60 transition-all active:scale-[0.98] shimmer-sweep"
                  >
                    {loading ? "Verifying..." : <>Enter Dashboard <ArrowRight className="size-5 ml-1" /></>}
                  </button>
                </form>
              </div>
            )}
          </div>

          <p className="mt-8 text-sm text-center text-muted-foreground font-medium stagger-in" style={{ "--delay": "0.3s" } as any}>
            Don't have an account?{" "}
            <Link to="/register" className="text-brand font-black hover:underline underline-offset-4">
              Join the waitlist
            </Link>
          </p>

        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-1 h-2 bg-gradient-to-r from-brand to-clinical" />
          <div className="p-8">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-black tracking-tighter">Reset access</DialogTitle>
              <DialogDescription className="text-sm font-medium pt-1">
                Enter your registered email and we'll send a secure link.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@clinic.org"
                className="w-full px-5 py-3.5 rounded-2xl bg-muted/60 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm font-bold"
              />
            </div>
            <DialogFooter className="sm:justify-between gap-3">
              <button
                onClick={() => setForgotOpen(false)}
                className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onForgotSubmit}
                className="px-8 py-3 rounded-2xl bg-brand text-brand-foreground text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:opacity-90 transition-all shimmer-sweep"
              >
                Send Link
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
