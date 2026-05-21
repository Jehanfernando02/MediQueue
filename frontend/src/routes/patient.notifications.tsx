import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/glass";
import { Bell, CheckCircle2, AlertCircle, Pill as PillIcon, Calendar, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotificationsThunk, markAllNotificationsReadThunk, markNotificationReadThunk } from "@/thunks/notificationThunks";
import { selectNotifications, selectNotificationStatus } from "@/store/slices/notificationSlice";

export const Route = createFileRoute("/patient/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MediQueue" }] }),
  component: Notifs,
});

const TONES: Record<string, string> = {
  reminder: "bg-warn-soft text-warn",
  confirmation: "bg-clinical-soft text-clinical",
  info: "bg-brand-soft text-brand",
  default: "bg-muted text-muted-foreground",
};

const ICONS: Record<string, any> = {
  reminder: Calendar,
  confirmation: CheckCircle2,
  info: PillIcon,
  default: Bell,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

function Notifs() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const status = useAppSelector(selectNotificationStatus);

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
  }, [dispatch]);

  const loading = status === "loading" && notifications.length === 0;

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsReadThunk());
  };

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      dispatch(markNotificationReadThunk(id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay on top of every update from your care team.</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-sm font-semibold text-brand hover:underline disabled:opacity-50"
          disabled={notifications.every(n => n.is_read)}
        >
          Mark all as read
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      ) : (
        <GlassCard className="divide-y divide-border">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || ICONS.default;
            const toneClass = TONES[n.type] || TONES.default;
            return (
              <div 
                key={n.id} 
                onClick={() => handleMarkRead(n.id, n.is_read)}
                className={`flex items-start gap-4 p-5 hover:bg-muted/40 transition-colors cursor-pointer ${!n.is_read ? 'bg-brand-soft/20' : ''}`}
              >
                <div className={["size-10 rounded-2xl grid place-items-center shrink-0", toneClass].join(" ")}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className={`text-sm ${!n.is_read ? 'font-bold' : 'font-semibold'}`}>{n.title}</h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                </div>
                {!n.is_read && <div className="size-2 bg-brand rounded-full mt-2" />}
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="size-8 opacity-20 mb-2" />
              You're all caught up. No new notifications.
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
