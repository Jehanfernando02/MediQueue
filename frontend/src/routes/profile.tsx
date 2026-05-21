import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, SectionHeading } from "@/components/ui/glass";
import { User, Mail, Shield, Save, Loader2, Heart } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { useAppDispatch } from "@/store/hooks";
import { updateProfileThunk } from "@/thunks/authThunks";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" />;

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    const result = await dispatch(updateProfileThunk({ name }));
    setSaving(false);
    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  };

  const roleColors: Record<Role, string> = {
    patient: "text-brand bg-brand-soft",
    doctor: "text-clinical bg-clinical-soft",
    admin: "text-danger bg-danger-soft",
  };

  return (
    <AppShell role={user.role} title="My Profile" subtitle="Manage your clinical identity and settings">
      <div className="space-y-8 fade-in">
        <header className="flex items-center gap-6">
          <div className="size-20 lg:size-24 rounded-3xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center text-3xl font-bold shadow-xl shadow-brand/20">
            {user.avatarSeed}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleColors[user.role]}`}>
                {user.role}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="size-3" /> Member since {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 lg:p-8">
              <SectionHeading title="Personal Information" />
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Full Display Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-brand transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-muted/40 border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1 italic">
                    This is how your name will appear to others in the system.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-muted/40 border border-border rounded-2xl pl-11 pr-4 py-3 text-sm cursor-not-allowed outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1">
                    Email cannot be changed in this demo.
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border/50 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || name === user.name}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-brand text-brand-foreground text-sm font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-danger/20 bg-danger-soft/10">
              <h3 className="text-sm font-bold text-danger flex items-center gap-2">
                <Shield className="size-4" /> Danger Zone
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="mt-4 px-4 py-2 border border-danger/30 text-danger text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-danger hover:text-white transition-all">
                Delete Account
              </button>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6 bg-white border border-brand/10 shadow-xl shadow-brand/5 overflow-hidden relative group">
              <div className="relative z-10">
                <Heart className="size-8 mb-4 text-brand group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-black leading-tight text-foreground">Patient Safety First</h3>
                <p className="text-sm font-medium text-muted-foreground mt-2 leading-relaxed">
                  Your identity as a <span className="text-brand font-black uppercase tracking-widest">{user.role}</span> is verified. Keeping your information up to date helps us provide better care across the platform.
                </p>
              </div>
              <div className="absolute -right-8 -bottom-8 size-32 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all" />
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-sm font-bold mb-4">Security Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Two-Factor Auth</div>
                  <span className="text-[10px] font-black text-danger uppercase tracking-widest">Off</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Active Session</div>
                  <span className="text-[10px] font-black text-clinical uppercase tracking-widest">Secure</span>
                </div>
              </div>
              <button className="w-full mt-6 py-2 rounded-xl bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Manage Security
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
