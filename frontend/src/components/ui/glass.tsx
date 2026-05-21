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
      className={cn(
        "glass-card rounded-3xl relative overflow-hidden group/glass", 
        hover && "lift", 
        className
      )}
      {...rest}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/glass:opacity-100 transition-opacity pointer-events-none" />
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
  const accentColor =
    tone === "brand" ? "bg-brand" :
    tone === "clinical" ? "bg-clinical" :
    tone === "warn" ? "bg-warn" :
    tone === "danger" ? "bg-danger" : "bg-border";
    
  const textColor =
    tone === "brand" ? "text-brand" :
    tone === "clinical" ? "text-clinical" :
    tone === "warn" ? "text-warn" :
    tone === "danger" ? "text-danger" : "text-foreground";

  return (
    <GlassCard hover className="p-6 relative">
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50", textColor)} />
      
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
        <div className={cn("p-2 rounded-xl bg-muted/40", textColor)}>
          {icon}
        </div>
      </div>
      
      <div className={cn("mt-4 text-4xl font-bold tracking-tight drop-shadow-sm", textColor)}>
        {value}
      </div>
      
      {hint && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="text-[11px] font-semibold text-muted-foreground/80 leading-none">
            {hint}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

const TONE: Record<string, string> = {
  brand: "bg-brand/10 text-brand border-brand/20",
  clinical: "bg-clinical/10 text-clinical border-clinical/20",
  warn: "bg-warn/10 text-warn border-warn/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function Pill({
  children, tone = "muted", className, dot = false, icon,
}: {
  children: ReactNode; tone?: keyof typeof TONE; className?: string; dot?: boolean; icon?: ReactNode;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm transition-all hover:scale-105",
      TONE[tone], className,
    )}>
      {icon && <span className="opacity-80">{icon}</span>}
      {dot && <span className="size-1.5 rounded-full bg-current pulse-dot" />}
      {children}
    </span>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 group/heading">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
          {title}
          <div className="h-[2px] w-0 group-hover/heading:w-8 bg-brand transition-all duration-500 rounded-full" />
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
