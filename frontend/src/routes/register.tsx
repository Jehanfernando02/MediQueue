import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { useAuth, type Role, homeForRole } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — MediQueue" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email || "demo@mediqueue.io", role);
      toast.success("Account created", { description: `Welcome, ${name || "there"}!` });
      navigate({ to: homeForRole(role) });
    }, 600);
  };

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
          <p className="text-sm text-muted-foreground mt-1">Join thousands of clinics already on MediQueue.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["patient", "doctor", "admin"] as Role[]).map((r) => (
                <button
                  type="button" key={r} onClick={() => setRole(r)}
                  className={[
                    "px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all",
                    role === r ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20" : "border-border text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)} required
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password" required minLength={6}
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-brand-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-brand/25 hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating…" : <>Create account <ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
