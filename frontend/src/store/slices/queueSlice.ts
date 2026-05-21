/**
 * Queue Slice — manages patient queue position and doctor queue stats
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface QueuePosition {
  position: number;
  ahead: number;
  eta_minutes: number;
  total_in_queue: number;
}

export interface DoctorQueueStats {
  total: number;
  completed: number;
  in_progress: number;
  remaining: number;
  avg_time_per_patient: number;
}

export interface QueueState {
  patientPosition: QueuePosition | null;
  doctorQueueStats: DoctorQueueStats | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: QueueState = {
  patientPosition: null,
  doctorQueueStats: null,
  status: "idle",
  error: null,
};

const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    setQueueLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setPatientPosition(state, action: PayloadAction<QueuePosition>) {
      state.patientPosition = action.payload;
      state.status = "succeeded";
    },

    setDoctorQueueStats(state, action: PayloadAction<DoctorQueueStats>) {
      state.doctorQueueStats = action.payload;
      state.status = "succeeded";
    },

    setQueueError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    clearQueue(state) {
      state.patientPosition = null;
      state.doctorQueueStats = null;
      state.status = "idle";
    },

    clearQueueError(state) {
      state.error = null;
    },
  },
});

export const {
  setQueueLoading,
  setPatientPosition,
  setDoctorQueueStats,
  setQueueError,
  clearQueue,
  clearQueueError,
} = queueSlice.actions;

export default queueSlice.reducer;

// Selectors
type SliceState = { queue: QueueState };

export const selectPatientPosition = (s: SliceState) => s.queue.patientPosition;
export const selectDoctorQueueStats = (s: SliceState) => s.queue.doctorQueueStats;
export const selectQueueStatus = (s: SliceState) => s.queue.status;
export const selectQueueError = (s: SliceState) => s.queue.error;
