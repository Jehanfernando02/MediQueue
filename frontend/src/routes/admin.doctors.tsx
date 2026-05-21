import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDoctorsThunk, createDoctorThunk, updateDoctorThunk, deleteDoctorThunk } from "@/thunks/doctorThunks";
import { fetchDepartmentsThunk } from "@/thunks/departmentThunks";
import { selectDoctors, selectDoctorStatus } from "@/store/slices/doctorSlice";
import { selectDepartments } from "@/store/slices/departmentSlice";
import type { Doctor } from "@/store/slices/doctorSlice";

export const Route = createFileRoute("/admin/doctors")({
  head: () => ({ meta: [{ title: "Doctors — MediQueue" }] }),
  component: Doctors,
});

function Doctors() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(selectDoctors);
  const departments = useAppSelector(selectDepartments);
  const status = useAppSelector(selectDoctorStatus);
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ name: "", specialty: "", email: "", password: "", department_id: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchDoctorsThunk());
    dispatch(fetchDepartmentsThunk());
  }, [dispatch]);

  const loading = status === "loading" && doctors.length === 0;

  const openNew = () => { 
    setEditing(null); 
    setForm({ name: "", specialty: "", email: "", password: "", department_id: "" }); 
    setOpen(true); 
  };
  
  const openEdit = (d: Doctor) => { 
    setEditing(d); 
    setForm({ name: d.name, specialty: d.specialty, email: d.email, password: "", department_id: d.department_id || "" }); 
    setOpen(true); 
  };

  const save = async () => {
    if (editing) {
      const result = await dispatch(updateDoctorThunk(editing.id, {
        name: form.name,
        specialty: form.specialty,
        department_id: form.department_id || undefined,
      }));
      if (result.success) {
        toast.success("Doctor updated");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update doctor");
      }
    } else {
      if (!form.password) {
        toast.error("Password is required for new doctors");
        return;
      }
      const result = await dispatch(createDoctorThunk({
        name: form.name,
        email: form.email,
        password: form.password,
        specialty: form.specialty,
        department_id: form.department_id || undefined,
      }));
      if (result.success) {
        toast.success("Doctor added");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to add doctor");
      }
    }
  };

  const remove = async (id: string) => { 
    if (!confirm("Are you sure you want to remove this doctor?")) return;
    const result = await dispatch(deleteDoctorThunk(id));
    if (result.success) toast.success("Doctor removed");
    else toast.error("Failed to remove doctor");
  };

  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground mt-2">Manage your clinical staff and assignments.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Search className="size-4 text-muted-foreground" />
            <input 
              placeholder="Search…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-44" 
            />
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25">
            <Plus className="size-4" /> Add doctor
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Specialty</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center text-[11px] font-bold">
                        {d.name.split(" ").map((s) => s[0]).join("")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{d.name}</span>
                        <span className="text-[10px] text-muted-foreground">{d.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{d.specialty}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {departments.find(dept => dept.id === d.department_id)?.name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Pill tone={d.status === "active" ? "clinical" : "muted"}>
                      {d.status.replace("_", " ")}
                    </Pill>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => openEdit(d)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground"><Pencil className="size-3.5" /></button>
                      <button onClick={() => remove(d.id)} className="size-8 rounded-lg hover:bg-danger-soft hover:text-danger grid place-items-center text-muted-foreground"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No doctors found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit doctor" : "Add doctor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
              />
            </div>
            {!editing && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialty</label>
              <input
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
              <select
                value={form.department_id}
                onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm appearance-none"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
            <button 
              onClick={save} 
              disabled={status === 'loading'}
              className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-semibold flex items-center gap-2"
            >
              {status === 'loading' && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Add doctor"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
