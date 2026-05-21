import { Search, Bell, ChevronDown, LogOut, UserRound, Menu, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavContent } from "./Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUnreadCount } from "@/store/slices/notificationSlice";
import { fetchUnreadCountThunk } from "@/thunks/notificationThunks";
import { useEffect } from "react";
import { cn } from "@/lib/utils";


export function Topbar({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    if (user) dispatch(fetchUnreadCountThunk());
  }, [dispatch, user?.id]);


  return (
    <header className="h-16 lg:h-20 border-b border-border bg-background/60 backdrop-blur-xl px-4 lg:px-10 flex items-center justify-between sticky top-0 z-20 relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-clinical to-brand opacity-60" />
      
      <div className="flex items-center gap-3 min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <button className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
              <Menu className="size-5 text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border overflow-hidden">
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
            <SheetHeader className="p-7 flex-row items-center gap-3 border-b border-sidebar-border relative z-10">
              <div className="size-9 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shadow-lg shadow-brand/20">
                <Heart className="size-5" strokeWidth={2.5} />
              </div>
              <div className="text-left leading-tight">
                <SheetTitle className="text-base font-bold tracking-tight text-foreground">MediQueue</SheetTitle>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Clinical OS</div>
              </div>
            </SheetHeader>
            <NavContent className="mt-4 relative z-10" />
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          {title && <h2 className="text-sm lg:text-lg font-bold tracking-tight truncate text-foreground/90">{title}</h2>}
          {subtitle && <p className="text-[10px] lg:text-xs text-muted-foreground/70 truncate font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div className="hidden md:flex items-center gap-2 bg-muted/40 px-4 py-2 rounded-full border border-border group focus-within:ring-2 focus-within:ring-brand/20 transition-all">
          <Search className="size-4 text-muted-foreground group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Search patients, doctors, slots…"
            className="bg-transparent border-none outline-none text-sm w-56 placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center gap-1 ml-2">
            <kbd className="text-[10px] font-sans font-bold text-muted-foreground/60 border border-border rounded px-1.5 py-0.5 bg-background shadow-sm">⌘</kbd>
            <kbd className="text-[10px] font-sans font-bold text-muted-foreground/60 border border-border rounded px-1.5 py-0.5 bg-background shadow-sm">K</kbd>
          </div>
        </div>

        <button
          onClick={() => user?.role === 'patient' && navigate({ to: '/patient/notifications' })}
          className={cn(
            "relative size-10 rounded-full border border-border hover:bg-muted transition-all active:scale-95 grid place-items-center",
            unreadCount > 0 && "animate-bounce"
          )}
        >
          <Bell className="size-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 size-2 bg-brand rounded-full ring-2 ring-background animate-pulse" />
          )}
        </button>


        {action}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border hover:bg-muted transition-all hover:border-brand/30 active:scale-95">
            <div className="relative size-7 rounded-full bg-gradient-to-br from-brand to-clinical text-white grid place-items-center font-bold text-xs shadow-md">
              {user?.avatarSeed}
              <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-clinical rounded-full border-2 border-background" title="Online" />
            </div>
            <span className="text-xs font-bold hidden sm:inline text-foreground/80">{user?.name.split(" ")[0]}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl">
            <DropdownMenuLabel className="p-3">
              <div className="text-sm font-bold">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />
            <div className="px-2 pt-2 pb-1">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold px-2 mb-1">
                Account Settings
              </div>
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="rounded-xl px-2 py-2 cursor-pointer">
                <UserRound className="size-4 mr-2 text-muted-foreground" /> 
                <span className="font-semibold text-xs">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }} className="rounded-xl px-2 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                <LogOut className="size-4 mr-2" /> 
                <span className="font-semibold text-xs">Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
