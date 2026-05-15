import { Search, Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  const { user, logout, setRole } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-20 border-b border-border bg-background/60 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      <div className="min-w-0">
        {title && <h2 className="text-lg font-bold tracking-tight truncate">{title}</h2>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div className="hidden md:flex items-center gap-2 bg-muted/60 px-4 py-2 rounded-full border border-border">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients, doctors, slots…"
            className="bg-transparent border-none outline-none text-sm w-56 placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>

        <button className="relative size-10 rounded-full border border-border hover:bg-muted transition-colors grid place-items-center">
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute top-2 right-2.5 size-2 bg-danger rounded-full ring-2 ring-background" />
        </button>

        {action}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
            <div className="size-7 rounded-full bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-xs">
              {user?.avatarSeed}
            </div>
            <span className="text-xs font-semibold hidden sm:inline">{user?.name.split(" ")[0]}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Switch role (demo)
            </DropdownMenuLabel>
            {(["patient", "doctor", "admin"] as Role[]).map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => {
                  setRole(r);
                  navigate({ to: r === "patient" ? "/patient" : r === "doctor" ? "/doctor" : "/admin" });
                }}
              >
                <UserRound className="size-3.5 mr-2 opacity-60" />
                <span className="capitalize">{r}</span>
                {user?.role === r && <span className="ml-auto text-[10px] text-brand font-semibold">Active</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="size-3.5 mr-2 opacity-60" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
