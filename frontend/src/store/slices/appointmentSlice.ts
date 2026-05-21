/**
 * Appointment Slice — manages user's appointments and booking flow
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string; // ISO date
  start_time: string; // ISO time
  status: "scheduled" | "arrived" | "in_progress" | "done" | "cancelled" | "no_show";
  queue_number: number | null;
  reason: string | null;
  notes_count: number;
  created_at: string;
}

export interface AppointmentState {
  myAppointments: Appointment[];
  allAppointments: (Appointment & { patient_name?: string; doctor_name?: string; specialty?: string })[];
  bookingFlow: {
    selectedDoctorId: string | null;
    selectedDate: string | null;
    selectedTime: string | null;
    reason: string | null;
  };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AppointmentState = {
  myAppointments: [],
  allAppointments: [],
  bookingFlow: {
    selectedDoctorId: null,
    selectedDate: null,
    selectedTime: null,
    reason: null,
  },
  status: "idle",
  error: null,
};


const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    setAppointmentsLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setAppointmentsSuccess(state, action: PayloadAction<Appointment[]>) {
      state.myAppointments = action.payload;
      state.status = "succeeded";
    },
    setAllAppointmentsSuccess(state, action: PayloadAction<AppointmentState["allAppointments"]>) {
      state.allAppointments = action.payload;
      state.status = "succeeded";
    },


    setAppointmentsError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    addAppointment(state, action: PayloadAction<Appointment>) {
      state.myAppointments.push(action.payload);
    },

    updateAppointmentStatus(state, action: PayloadAction<{ id: string; status: string }>) {
      const appt = state.myAppointments.find((a) => a.id === action.payload.id);
      if (appt) appt.status = action.payload.status as Appointment["status"];
    },

    removeAppointment(state, action: PayloadAction<string>) {
      state.myAppointments = state.myAppointments.filter((a) => a.id !== action.payload);
    },

    // Booking flow
    setBookingDoctor(state, action: PayloadAction<string>) {
      state.bookingFlow.selectedDoctorId = action.payload;
    },

    setBookingDate(state, action: PayloadAction<string>) {
      state.bookingFlow.selectedDate = action.payload;
    },

    setBookingTime(state, action: PayloadAction<string>) {
      state.bookingFlow.selectedTime = action.payload;
    },

    setBookingReason(state, action: PayloadAction<string>) {
      state.bookingFlow.reason = action.payload;
    },

    resetBookingFlow(state) {
      state.bookingFlow = {
        selectedDoctorId: null,
        selectedDate: null,
        selectedTime: null,
        reason: null,
      };
    },

    clearAppointmentError(state) {
      state.error = null;
    },
  },
});

export const {
  setAppointmentsLoading,
  setAppointmentsSuccess,
  setAllAppointmentsSuccess,
  setAppointmentsError,

  addAppointment,
  updateAppointmentStatus,
  removeAppointment,
  setBookingDoctor,
  setBookingDate,
  setBookingTime,
  setBookingReason,
  resetBookingFlow,
  clearAppointmentError,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;

// Selectors
import { createSelector } from "@reduxjs/toolkit";

type SliceState = { appointment: AppointmentState };

export const selectMyAppointments = (s: SliceState) => s.appointment.myAppointments;
export const selectAllAppointments = (s: SliceState) => s.appointment.allAppointments;
export const selectBookingFlow = (s: SliceState) => s.appointment.bookingFlow;

export const selectAppointmentStatus = (s: SliceState) => s.appointment.status;
export const selectAppointmentError = (s: SliceState) => s.appointment.error;

export const selectUpcomingAppointments = createSelector(
  [selectMyAppointments],
  (appointments) =>
    appointments.filter(
      (a) => new Date(a.date) >= new Date() && a.status !== "cancelled"
    )
);

export const selectPastAppointments = createSelector(
  [selectMyAppointments],
  (appointments) =>
    appointments.filter((a) => new Date(a.date) < new Date())
);
