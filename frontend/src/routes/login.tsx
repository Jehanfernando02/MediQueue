import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart, Stethoscope, ShieldCheck, UserRound, ArrowRight, AlertCircle,
} from "lucide-react";
import { type Role, homeForRole } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectAuthError, clearError } from "@/store/slices/authSlice";
import { loginThunk } from "@/thunks/authThunks";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediQueue" }] }),
  component: Login,
});

const ROLES: {
  id: Role;
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "patient", title: "Patient", copy: "Book and track your visits", icon: UserRound },
  { id: "doctor", title: "Doctor", copy: "Manage today's queue", icon: Stethoscope },
  { id: "admin", title: "Admin", copy: "Operate the entire clinic", icon: ShieldCheck },
];

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const apiError = useAppSelector(selectAuthError);

  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const loading = status === "loading";

  // Clear stale errors when the user edits the form
  useEffect(() => {
    if (apiError) dispatch(clearError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, role]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (result.success) {
      toast.success("Welcome back", { description: `Signed in as ${result.user.role}` });
      navigate({ to: homeForRole(result.user.role) });
    }
  };

  const onForgotSubmit = () => {
    setForgotOpen(false);
    toast.success("Reset link sent", { description: "If that email exists, check your inbox." });
  };

  return (
    <div className="min-h-screen soft-gradient grid lg:grid-cols-2">
      {/* Left panel */}
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
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} MediQueue, Inc.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your role and continue.</p>
          </div>

          {/* Role tabs */}
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

          {/* API error banner */}
          {apiError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.org"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-sm"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-brand-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-brand/25 hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {loading ? "Signing in…" : <>Sign in <ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            New to MediQueue?{" "}
            <Link to="/register" className="text-brand font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll send you a secure reset link.
            </DialogDescription>
          </DialogHeader>
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="you@hospital.org"
            className="w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
          />
          <DialogFooter>
            <button
              onClick={() => setForgotOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground"
            >
              Cancel
            </button>
            <button
              onClick={onForgotSubmit}
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
