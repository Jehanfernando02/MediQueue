import axios from "axios";
import api from "@/api/axiosClient";
import {
  setNotificationsLoading,
  setNotificationsSuccess,
  setNotificationsError,
  markRead,
  markAllRead,
  setUnreadCount,
} from "@/store/slices/notificationSlice";
import type { AppDispatch } from "@/store/store";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to handle notification";
  }
  return "Something went wrong";
}

export const fetchNotificationsThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setNotificationsLoading());
  try {
    const { data } = await api.get("/notifications");
    dispatch(setNotificationsSuccess(data.data));
  } catch (err) {
    dispatch(setNotificationsError(extractError(err)));
  }
};

export const markNotificationReadThunk = (id: string) => async (dispatch: AppDispatch) => {
  try {
    await api.patch(`/notifications/${id}/read`);
    dispatch(markRead(id));
  } catch (err) {
    console.error(extractError(err));
  }
};

export const markAllNotificationsReadThunk = () => async (dispatch: AppDispatch) => {
  try {
    await api.post("/notifications/read-all");
    dispatch(markAllRead());
  } catch (err) {
    console.error(extractError(err));
  }
};

export const fetchUnreadCountThunk = () => async (dispatch: AppDispatch) => {
  try {
    const { data } = await api.get("/notifications/unread-count");
    dispatch(setUnreadCount(data.data.unread_count));

  } catch (err) {
    console.error(extractError(err));
  }
};
