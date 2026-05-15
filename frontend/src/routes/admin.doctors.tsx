import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/doctors")({
  head: () => ({ meta: [{ title: "Doctors — MediQueue" }] }),
  component: Doctors,
});

interface Doc { id: string; name: string; spec: string; email: string; status: "Active" | "On leave"; load: number; }

const SEED: Doc[] = [
  { id: "1", name: "Dr. Aris Thorne", spec: "Cardiology", email: "athorne@mediqueue.io", status: "Active", load: 88 },
  { id: "2", name: "Dr. Sarah Chen", spec: "Dermatology", email: "schen@mediqueue.io", status: "Active", load: 72 },
  { id: "3", name: "Dr. Marcus Lee", spec: "Pediatrics", email: "mlee@mediqueue.io", status: "Active", load: 91 },
  { id: "4", name: "Dr. Priya Rao", spec: "Neurology", email: "prao@mediqueue.io", status: "On leave", load: 0 },
  { id: "5", name: "Dr. Benjamin Frost", spec: "Orthopedics", email: "bfrost@mediqueue.io", status: "Active", load: 64 },
];

function Doctors() {
  const [list, setList] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState({ name: "", spec: "", email: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", spec: "", email: "" }); setOpen(true); };
  const openEdit = (d: Doc) => { setEditing(d); setForm({ name: d.name, spec: d.spec, email: d.email }); setOpen(true); };
  const save = () => {
    if (editing) {
      setList((l) => l.map((d) => d.id === editing.id ? { ...d, ...form } : d));
      toast.success("Doctor updated");
    } else {
      setList((l) => [...l, { id: String(Date.now()), ...form, status: "Active" as const, load: 0 }]);
      toast.success("Doctor added");
    }
    setOpen(false);
  };
  const remove = (id: string) => { setList((l) => l.filter((d) => d.id !== id)); toast.success("Doctor removed"); };

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
            <input placeholder="Search…" className="bg-transparent outline-none text-sm w-44" />
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-semibold shadow-lg shadow-brand/25">
            <Plus className="size-4" /> Add doctor
          </button>
        </div>
      </header>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Specialty</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Load</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((d) => (
              <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center text-[11px] font-bold">
                      {d.name.replace("Dr. ", "").split(" ").map((s) => s[0]).join("")}
                    </div>
                    <span className="text-sm font-semibold">{d.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{d.spec}</td>
                <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{d.email}</td>
                <td className="px-6 py-4"><Pill tone={d.status === "Active" ? "clinical" : "muted"}>{d.status}</Pill></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand" style={{ width: `${d.load}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8">{d.load}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => openEdit(d)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground"><Pencil className="size-3.5" /></button>
                    <button onClick={() => remove(d.id)} className="size-8 rounded-lg hover:bg-danger-soft hover:text-danger grid place-items-center text-muted-foreground"><Trash2 className="size-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit doctor" : "Add doctor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              ["Name", "name"], ["Specialty", "spec"], ["Email", "email"],
            ].map(([l, k]) => (
              <div key={k}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</label>
                <input
                  value={(form as Record<string, string>)[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
            <button onClick={save} className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-semibold">
              {editing ? "Save changes" : "Add doctor"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
