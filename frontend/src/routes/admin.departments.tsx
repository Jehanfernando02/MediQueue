import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Building2, Users, Stethoscope, ArrowUpRight, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDepartmentsThunk, createDepartmentThunk, updateDepartmentThunk, deleteDepartmentThunk } from "@/thunks/departmentThunks";
import { fetchDoctorsThunk } from "@/thunks/doctorThunks";
import { selectDepartments, selectDepartmentStatus } from "@/store/slices/departmentSlice";
import { selectDoctors } from "@/store/slices/doctorSlice";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Department } from "@/store/slices/departmentSlice";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — MediQueue" }] }),
  component: Depts,
});

function Depts() {
  const dispatch = useAppDispatch();
  const departments = useAppSelector(selectDepartments);
  const doctors = useAppSelector(selectDoctors);
  const status = useAppSelector(selectDepartmentStatus);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    dispatch(fetchDepartmentsThunk());
    dispatch(fetchDoctorsThunk());
  }, [dispatch]);

  const loading = status === "loading" && departments.length === 0;

  const openNew = () => { setEditing(null); setForm({ name: "", description: "" }); setOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, description: d.description || "" }); setOpen(true); };

  const save = async () => {
    if (editing) {
      const result = await dispatch(updateDepartmentThunk(editing.id, form));
      if (result.success) {
        toast.success("Department updated");
        setOpen(false);
      } else {
        toast.error("Failed to update department");
      }
    } else {
      const result = await dispatch(createDepartmentThunk(form));
      if (result.success) {
        toast.success("Department created");
        setOpen(false);
      } else {
        toast.error("Failed to create department");
      }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this department? This will not delete doctors but will remove their department affiliation.")) return;
    const result = await dispatch(deleteDepartmentThunk(id));
    if (result.success) toast.success("Department removed");
    else toast.error("Failed to remove department");
  };

  const colors = [
    "from-brand to-clinical",
    "from-clinical to-brand",
    "from-brand to-warn",
    "from-clinical to-warn",
    "from-warn to-brand",
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-2">Capacity and ownership across your clinical organization.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25 transition-transform hover:scale-105">
          <Plus className="size-4" /> Create Department
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d, i) => {
            const deptDoctors = doctors.filter(doc => doc.department_id === d.id);
            const color = colors[i % colors.length];
            return (
              <GlassCard key={d.id} hover className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`size-12 rounded-2xl bg-gradient-to-br ${color} text-white grid place-items-center`}>
                    <Building2 className="size-5" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="size-8 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-muted">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => remove(d.id)} className="size-8 rounded-full border border-border grid place-items-center text-muted-foreground hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold">{d.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] mt-1">
                  {d.description || "No description provided."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground"><Stethoscope className="size-3" /> Doctors</div>
                    <div className="text-xl font-bold mt-1">{deptDoctors.length}</div>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground"><Users className="size-3" /> Capacity</div>
                    <div className="text-xl font-bold mt-1">High</div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Staffing Level</span>
                    <span className="font-semibold">{Math.min(100, deptDoctors.length * 15)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(100, deptDoctors.length * 15)}%` }} />
                  </div>
                </div>
              </GlassCard>
            );
          })}
          {departments.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Building2 className="size-12 mx-auto mb-4 opacity-20" />
              <p>No departments created yet.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Create Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cardiology"
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description of clinical services…"
                rows={3}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm resize-none"
              />
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
              {editing ? "Save changes" : "Create department"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
