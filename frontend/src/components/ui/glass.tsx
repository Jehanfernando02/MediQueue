import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  hover = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn("glass-card rounded-3xl", hover && "lift", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "brand" | "clinical" | "warn" | "danger";
  icon?: ReactNode;
}
export function StatCard({ label, value, hint, tone = "default", icon }: StatProps) {
  const accent =
    tone === "brand" ? "text-brand" :
    tone === "clinical" ? "text-clinical" :
    tone === "warn" ? "text-warn" :
    tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        {icon}
      </div>
      <div className={cn("mt-3 text-3xl font-bold tracking-tight", accent)}>{value}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </GlassCard>
  );
}

const TONE: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  clinical: "bg-clinical-soft text-clinical",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  muted: "bg-muted text-muted-foreground",
};

export function Pill({
  children, tone = "muted", className, dot = false,
}: {
  children: ReactNode; tone?: keyof typeof TONE; className?: string; dot?: boolean;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      TONE[tone], className,
    )}>
      {dot && <span className="size-1.5 rounded-full bg-current pulse-dot" />}
      {children}
    </span>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      {action}
    </div>
  );
}
