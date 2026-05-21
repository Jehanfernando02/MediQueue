import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { type Role, homeForRole } from "@/lib/auth";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectAuthError, clearError } from "@/store/slices/authSlice";
import { registerThunk } from "@/thunks/authThunks";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loading = status === "loading";

  useEffect(() => {
    if (apiError) dispatch(clearError());
  }, [name, email, password, confirmPassword, role, dispatch, apiError]);

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
    <div className="min-h-screen dot-grid bg-background flex items-center justify-center p-6 selection:bg-brand/30">
      <div className="w-full max-w-xl relative">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 size-64 bg-brand/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -right-24 size-64 bg-clinical/10 blur-[100px] rounded-full animate-pulse" />

        <div className="relative z-10 text-center mb-10 stagger-in" style={{ "--delay": "0.1s" } as any}>
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="size-12 rounded-2xl bg-brand text-brand-foreground grid place-items-center shadow-2xl shadow-brand/20 group-hover:scale-110 transition-transform shimmer-sweep">
              <Heart className="size-6" strokeWidth={3} />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xl font-black tracking-tighter">MediQueue</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Clinical OS</div>
            </div>
          </Link>
          <h2 className="text-4xl font-black tracking-tighter mt-8">Create your profile</h2>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Join the next generation of digital clinical care.</p>
        </div>

        <div className="glass-card p-10 stagger-in relative" style={{ "--delay": "0.2s" } as any}>
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-brand to-clinical opacity-80" />

          {displayError && (
            <div className="mb-8 flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-bold text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="size-4 shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Your Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["patient", "doctor", "admin"] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                      role === r
                        ? "bg-brand text-brand-foreground border-brand shadow-lg shadow-brand/20"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Full name
                </label>
                <input
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Carter"
                  className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Email address
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@clinic.org"
                  className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold pr-12"
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Confirm access
                </label>
                <div className="relative group">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 rounded-2xl bg-muted/40 border border-border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-semibold pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-brand transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-foreground text-sm font-black uppercase tracking-widest shadow-2xl shadow-brand/40 hover:opacity-95 disabled:opacity-60 transition-all active:scale-[0.98] shimmer-sweep"
            >
              {loading ? "Creating..." : <>Create Account <ArrowRight className="size-5 ml-1" /></>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-brand font-black hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
