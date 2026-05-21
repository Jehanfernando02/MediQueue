import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  status: "idle",
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotificationsLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setNotificationsSuccess(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
      state.status = "succeeded";
      state.unreadCount = action.payload.filter(n => !n.is_read).length;
    },
    setNotificationsError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    markRead(state, action: PayloadAction<string>) {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.notifications.forEach(n => { n.is_read = true; });
      state.unreadCount = 0;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) state.unreadCount += 1;
    },
    setUnreadCount(state, action: PayloadAction<number>) {

      state.unreadCount = action.payload;
    }
  },
});

export const {
  setNotificationsLoading,
  setNotificationsSuccess,
  setNotificationsError,
  markRead,
  markAllRead,
  addNotification,
  setUnreadCount,
} = notificationSlice.actions;


export default notificationSlice.reducer;

// Selectors
type SliceState = { notification: NotificationState };
export const selectNotifications = (s: SliceState) => s.notification.notifications;
export const selectUnreadCount = (s: SliceState) => s.notification.unreadCount;
export const selectNotificationStatus = (s: SliceState) => s.notification.status;
