import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, ArrowRight, AlertCircle } from "lucide-react";
import { type Role, homeForRole } from "@/lib/auth";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectAuthError, clearError } from "@/store/slices/authSlice";
import { registerThunk } from "@/thunks/authThunks";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — MediQueue" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const apiError = useAppSelector(selectAuthError);

  const [role, setRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const loading = status === "loading";

  // Clear stale Redux errors when user edits the form
  useEffect(() => {
    if (apiError) dispatch(clearError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, password, confirmPassword, role]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    const result = await dispatch(registerThunk({ email, password, name, role }));

    if (result.success) {
      toast.success("Account created", {
        description: `Welcome, ${result.user.name}!`,
      });
      navigate({ to: homeForRole(result.user.role) });
    }
  };

  const displayError = localError || apiError;

  return (
    <div className="min-h-screen soft-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md fade-in">
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="size-10 rounded-xl bg-brand text-brand-foreground grid place-items-center shadow-lg shadow-brand/25">
            <Heart className="size-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">MediQueue</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical OS</div>
          </div>
        </Link>

        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Join thousands of clinics already on MediQueue.
          </p>

          {/* Error banner */}
          {displayError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2">
              {(["patient", "doctor", "admin"] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={[
                    "px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all",
                    role === r
                      ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20"
                      : "border-border text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <input
                id="register-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Carter"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@clinic.org"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-brand-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-brand/25 hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating…" : <>Create account <ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
