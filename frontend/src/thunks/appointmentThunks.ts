/**
 * Appointment Thunks — async operations for appointments
 */

import axios from "axios";
import api from "@/api/axiosClient";
import {
  setAppointmentsLoading,
  setAppointmentsSuccess,
  setAllAppointmentsSuccess,
  setAppointmentsError,
  addAppointment,
  updateAppointmentStatus,
  removeAppointment,
  resetBookingFlow,
  type Appointment,
} from "@/store/slices/appointmentSlice";
import type { AppDispatch } from "@/store/store";
import { addNotification } from "@/store/slices/notificationSlice";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to process appointment";
  }
  return "Something went wrong";
}

/**
 * Fetch all appointments in the system (Admin only)
 */
export const fetchAllAppointmentsThunk =
  (filters?: { status?: string; date_from?: string; date_to?: string }) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      const { data } = await api.get("/appointments", { params: filters });
      dispatch(setAllAppointmentsSuccess(data.data));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Fetch appointments for the current authenticated user (Patient or Doctor)
 */
export const fetchMyAppointmentsThunk =
  () =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      const { data } = await api.get("/appointments/me");
      dispatch(setAppointmentsSuccess(data.data));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Fetch doctor's appointments for today
 */
export const fetchDoctorTodayAppointmentsThunk =
  () =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; appointments?: Appointment[]; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      const { data } = await api.get("/appointments/today");
      const appointments: Appointment[] = data.data;
      dispatch(setAppointmentsSuccess(appointments));
      return { success: true, appointments };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Book a new appointment
 */
export const bookAppointmentThunk =
  (payload: {
    doctor_id: string;
    slot_id?: string;
    date: string;
    start_time: string;
    reason?: string;
  }) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; appointment?: Appointment; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      const { data } = await api.post("/appointments", payload);
      const appointment: Appointment = data.data;
      dispatch(addAppointment(appointment));
      dispatch(resetBookingFlow());

      // Add notification
      dispatch(
        addNotification({
          id: `notif-${Date.now()}`,
          user_id: "",
          type: "appointment_confirmed",
          title: "Appointment Confirmed",
          body: `Your appointment has been booked successfully for ${appointment.date}`,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      );

      return { success: true, appointment };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Cancel an appointment (Patient/Admin)
 */
export const cancelAppointmentThunk =
  (appointmentId: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      await api.delete(`/appointments/me/${appointmentId}`);
      dispatch(removeAppointment(appointmentId));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Update appointment status (Doctor/Admin)
 */
export const updateAppointmentStatusThunk =
  (appointmentId: string, status: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setAppointmentsLoading());
    try {
      const { data } = await api.patch(`/appointments/${appointmentId}/status`, { status });
      dispatch(updateAppointmentStatus({ id: appointmentId, status: data.data.status }));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };

/**
 * Add a note to an appointment (Doctor)
 */
export const addAppointmentNoteThunk =
  (appointmentId: string, content: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post(`/appointments/${appointmentId}/notes`, { content });
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setAppointmentsError(message));
      return { success: false, error: message };
    }
  };
