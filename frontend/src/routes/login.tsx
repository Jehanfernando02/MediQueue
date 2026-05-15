import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Stethoscope, ShieldCheck, UserRound, ArrowRight } from "lucide-react";
import { useAuth, type Role, homeForRole } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediQueue" }] }),
  component: Login,
});

const ROLES: { id: Role; title: string; copy: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "patient", title: "Patient", copy: "Book and track your visits", icon: UserRound },
  { id: "doctor", title: "Doctor", copy: "Manage today's queue", icon: Stethoscope },
  { id: "admin", title: "Admin", copy: "Operate the entire clinic", icon: ShieldCheck },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState("demo@mediqueue.io");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, role);
      toast.success("Welcome back", { description: `Signed in as ${role}` });
      navigate({ to: homeForRole(role) });
    }, 500);
  };

  return (
    <div className="min-h-screen soft-gradient grid lg:grid-cols-2">
      <div className="hidden lg:flex p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand text-brand-foreground grid place-items-center shadow-lg shadow-brand/25">
            <Heart className="size-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">MediQueue</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical OS</div>
          </div>
        </Link>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Calm, real-time clinic operations for everyone in the room.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Trusted by clinicians and operators to run high-volume schedules without the noise.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} MediQueue, Inc.</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your role and continue.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-muted/60 rounded-2xl mb-6">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={[
                    "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold transition-all",
                    active
                      ? "bg-background shadow-sm text-brand ring-1 ring-brand/20"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  {r.title}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mb-6 -mt-3 px-1 fade-in" key={role}>
            {ROLES.find((r) => r.id === role)!.copy}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-semibold text-brand hover:underline">
                  Forgot?
                </button>
              </div>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-sm"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-brand-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-brand/25 hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {loading ? "Signing in…" : <>Sign in <ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            New to MediQueue?{" "}
            <Link to="/register" className="text-brand font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll send you a secure reset link.
            </DialogDescription>
          </DialogHeader>
          <input
            type="email" placeholder="you@hospital.org"
            className="w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
          />
          <DialogFooter>
            <button onClick={() => setForgotOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">
              Cancel
            </button>
            <button
              onClick={() => { setForgotOpen(false); toast.success("Reset link sent", { description: "Check your inbox." }); }}
              className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-semibold"
            >
              Send link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
