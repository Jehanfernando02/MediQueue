/**
 * Queue Thunks — async operations for queue positions
 */

import axios from "axios";
import api from "@/api/axiosClient";
import {
  setQueueLoading,
  setPatientPosition,
  setDoctorQueueStats,
  setQueueError,
  type QueuePosition,
  type DoctorQueueStats,
} from "@/store/slices/queueSlice";
import type { AppDispatch } from "@/store/store";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to fetch queue info";
  }
  return "Something went wrong";
}

export const fetchPatientPositionThunk =
  (doctorId: string, appointmentDate: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setQueueLoading());
    try {
      const { data } = await api.get("/queue/my-position", {
        params: { doctor_id: doctorId, appointment_date: appointmentDate },
      });
      const position: QueuePosition = data.data;
      dispatch(setPatientPosition(position));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setQueueError(message));
      return { success: false, error: message };
    }
  };

export const fetchDoctorQueueStatsThunk =
  () =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setQueueLoading());
    try {
      const { data } = await api.get("/queue/doctor/today");
      const stats: DoctorQueueStats = data.data;
      dispatch(setDoctorQueueStats(stats));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setQueueError(message));
      return { success: false, error: message };
    }
  };
