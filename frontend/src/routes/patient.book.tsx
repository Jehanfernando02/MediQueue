import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { Search, Filter, Star, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/book")({
  head: () => ({ meta: [{ title: "Book appointment — MediQueue" }] }),
  component: Book,
});

const SPECIALTIES = ["All", "Cardiology", "Dermatology", "Pediatrics", "Neurology", "Orthopedics"];

const DOCTORS = [
  { name: "Dr. Aris Thorne", spec: "Cardiology", rating: 4.9, reviews: 312, next: "Today", clinic: "St. Jude Medical", price: "$120", initials: "AT" },
  { name: "Dr. Sarah Chen", spec: "Dermatology", rating: 4.8, reviews: 198, next: "Tomorrow", clinic: "Pacific Care", price: "$95", initials: "SC" },
  { name: "Dr. Marcus Lee", spec: "Pediatrics", rating: 4.9, reviews: 421, next: "Today", clinic: "Northgate Clinic", price: "$80", initials: "ML" },
  { name: "Dr. Priya Rao", spec: "Neurology", rating: 5.0, reviews: 86, next: "Oct 16", clinic: "St. Jude Medical", price: "$180", initials: "PR" },
];

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

function Book() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [spec, setSpec] = useState("All");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<typeof DOCTORS[number] | null>(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = DOCTORS.filter(
    (d) => (spec === "All" || d.spec === spec) && d.name.toLowerCase().includes(query.toLowerCase()),
  );

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Book an appointment</h1>
        <p className="text-muted-foreground mt-2">Find the right specialist and pick a time that works for you.</p>
      </header>

      <div className="flex items-center gap-2">
        {[
          { n: 1, l: "Find doctor" },
          { n: 2, l: "Pick time" },
          { n: 3, l: "Confirm" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={[
              "size-7 rounded-full grid place-items-center text-xs font-bold transition-colors",
              step >= (s.n as 1 | 2 | 3) ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
            ].join(" ")}>
              {step > s.n ? <CheckCircle2 className="size-4" /> : s.n}
            </div>
            <span className={["text-sm font-semibold", step >= (s.n as 1 | 2 | 3) ? "text-foreground" : "text-muted-foreground"].join(" ")}>{s.l}</span>
            {i < 2 && <div className="w-12 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <GlassCard className="p-6 fade-in">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-full bg-muted border border-border">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by doctor name…"
                className="bg-transparent outline-none border-none w-full text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border text-xs font-semibold">
              <Filter className="size-3.5" /> Filters
            </button>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {SPECIALTIES.map((s) => (
              <button
                key={s} onClick={() => setSpec(s)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  spec === s ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {filtered.map((d) => (
              <button
                key={d.name}
                onClick={() => { setPicked(d); setStep(2); }}
                className="text-left group p-5 rounded-2xl border border-border hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold">
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.spec} • {d.clinic}</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Star className="size-3.5 text-warn fill-warn" />
                    <span className="font-semibold">{d.rating}</span>
                    <span className="text-muted-foreground">({d.reviews})</span>
                  </div>
                  <Pill tone={d.next === "Today" ? "clinical" : "muted"}>{d.next}</Pill>
                  <div className="text-sm font-semibold">{d.price}</div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {step === 2 && picked && (
        <GlassCard className="p-6 fade-in">
          <div className="flex items-center gap-4 pb-5 border-b border-border">
            <button onClick={() => setStep(1)} className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <div className="size-12 rounded-2xl bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold">{picked.initials}</div>
            <div className="flex-1">
              <div className="font-bold">{picked.name}</div>
              <div className="text-xs text-muted-foreground">{picked.spec} • {picked.clinic}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{picked.price}</div>
              <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Per visit</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Choose a date</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d, i) => {
                const active = day === i;
                return (
                  <button
                    key={i} onClick={() => setDay(i)}
                    className={[
                      "shrink-0 w-16 py-3 rounded-2xl border text-center transition-all",
                      active ? "bg-brand text-brand-foreground border-brand shadow-md shadow-brand/20" : "border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    <div className={["text-[10px] uppercase font-bold tracking-wider", active ? "text-brand-foreground/80" : "text-muted-foreground"].join(" ")}>
                      {d.toLocaleDateString("en", { weekday: "short" })}
                    </div>
                    <div className="text-lg font-bold leading-none mt-1">{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Available slots</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {SLOTS.map((s) => {
                const active = slot === s;
                return (
                  <button
                    key={s} onClick={() => setSlot(s)}
                    className={[
                      "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      active ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              disabled={!slot}
              onClick={() => { setStep(3); setConfirmOpen(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-foreground px-6 py-2.5 text-sm font-semibold disabled:opacity-50 shadow-lg shadow-brand/25"
            >
              Continue to confirm <ChevronRight className="size-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {step === 3 && picked && (
        <GlassCard className="p-10 text-center fade-in">
          <div className="size-16 mx-auto rounded-3xl bg-clinical-soft text-clinical grid place-items-center mb-5">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Appointment confirmed</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            You're booked with {picked.name} on{" "}
            {days[day].toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} at {slot}.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => { setStep(1); setSlot(null); setPicked(null); }} className="px-5 py-2.5 rounded-full border border-border text-sm font-semibold">
              Book another
            </button>
          </div>
        </GlassCard>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm your appointment</DialogTitle>
            <DialogDescription>
              {picked?.name} • {picked?.spec} on {days[day].toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} at {slot}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Visit fee</span><span className="font-semibold">{picked?.price}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Booking fee</span><span className="font-semibold">$0.00</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total</span><span>{picked?.price}</span></div>
          </div>
          <DialogFooter>
            <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
            <button
              onClick={() => { setConfirmOpen(false); toast.success("Appointment booked", { description: `${picked?.name} • ${slot}` }); }}
              className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm font-semibold"
            >
              Confirm booking
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
