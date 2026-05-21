/**
 * Doctor Slice — manages doctor list, search, and detail views
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department_id: string | null;
  status: "active" | "on_leave" | "inactive";
  rating: number;
  review_count: number;
  consultation_fee: number;
  created_at: string;
  email: string;
}

export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  last_visit?: string;
  age?: number;
  risk_score?: "Low" | "Moderate" | "High";
}

export interface WeeklySchedule {
  range: { from: string; to: string };
  availability: { day: number; start: string; end: string }[];
  appointments: { id: string; date: string; time: string; patient_name: string; status: string }[];
}

export interface DoctorState {
  doctors: Doctor[];
  myPatients: PatientProfile[];
  selectedDoctor: Doctor | null;
  slots: Slot[];
  schedule: WeeklySchedule | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  myPatients: [],
  selectedDoctor: null,
  slots: [],
  schedule: null,
  status: "idle",
  error: null,
};


const doctorSlice = createSlice({
  name: "doctor",
  initialState,
  reducers: {
    setDoctorsLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setDoctorsSuccess(state, action: PayloadAction<Doctor[]>) {
      state.doctors = action.payload;
      state.status = "succeeded";
    },
    setMyPatientsSuccess(state, action: PayloadAction<PatientProfile[]>) {
      state.myPatients = Array.isArray(action.payload) ? action.payload : [];
      state.status = "succeeded";
    },


    setDoctorsError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    setSlotsSuccess(state, action: PayloadAction<Slot[]>) {
      state.slots = action.payload;
      state.status = "succeeded";
    },

    setScheduleSuccess(state, action: PayloadAction<WeeklySchedule>) {
      state.schedule = action.payload;
      state.status = "succeeded";
    },

    setSelectedDoctor(state, action: PayloadAction<Doctor | null>) {
      state.selectedDoctor = action.payload;
    },

    addDoctor(state, action: PayloadAction<Doctor>) {
      state.doctors.push(action.payload);
    },

    updateDoctor(state, action: PayloadAction<Doctor>) {
      const idx = state.doctors.findIndex((d) => d.id === action.payload.id);
      if (idx >= 0) state.doctors[idx] = action.payload;
    },

    removeDoctor(state, action: PayloadAction<string>) {
      state.doctors = state.doctors.filter((d) => d.id !== action.payload);
    },

    clearDoctorError(state) {
      state.error = null;
    },
  },
});

export const {
  setDoctorsLoading,
  setDoctorsSuccess,
  setMyPatientsSuccess,
  setDoctorsError,

  setSelectedDoctor,
  addDoctor,
  updateDoctor,
  removeDoctor,
  clearDoctorError,
  setSlotsSuccess,
  setScheduleSuccess,
} = doctorSlice.actions;

export default doctorSlice.reducer;

// Selectors
type SliceState = { doctor: DoctorState };

export const selectDoctors = (s: SliceState) => s.doctor.doctors;
export const selectMyPatients = (s: SliceState) => s.doctor.myPatients;
export const selectSelectedDoctor = (s: SliceState) => s.doctor.selectedDoctor;

export const selectDoctorStatus = (s: SliceState) => s.doctor.status;
export const selectDoctorError = (s: SliceState) => s.doctor.error;
export const selectDoctorSlots = (s: SliceState) => s.doctor.slots;
export const selectDoctorSchedule = (s: SliceState) => s.doctor.schedule;
export const selectDoctorsBySpecialty = (specialty: string) => (s: SliceState) =>
  s.doctor.doctors.filter((d) => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
