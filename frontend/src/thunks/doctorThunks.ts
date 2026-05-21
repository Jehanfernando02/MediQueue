/**
 * Doctor Thunks — async operations for doctors
 */

import axios from "axios";
import api, { API_BASE } from "@/api/axiosClient";
import {
  setDoctorsLoading,
  setDoctorsSuccess,
  setMyPatientsSuccess,
  setDoctorsError,
  addDoctor,
  updateDoctor,
  removeDoctor,
  setSlotsSuccess,
  setScheduleSuccess,
  type Doctor,
} from "@/store/slices/doctorSlice";
import type { AppDispatch } from "@/store/store";

export const fetchDoctorPatientsThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setDoctorsLoading());
  try {
    const { data } = await api.get("/doctors/me/patients");
    dispatch(setMyPatientsSuccess(data.data));
  } catch (err) {
    dispatch(setDoctorsError(extractError(err)));
  }
};

export const fetchDoctorSlotsThunk = (doctorId: string, date: string) => async (dispatch: AppDispatch) => {
  dispatch(setDoctorsLoading());
  try {
    const { data } = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
    dispatch(setSlotsSuccess(data.data));
  } catch (err) {
    dispatch(setDoctorsError(extractError(err)));
  }
};

export const fetchDoctorScheduleThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setDoctorsLoading());
  try {
    const { data } = await api.get("/doctors/me/schedule");
    dispatch(setScheduleSuccess(data.data));
  } catch (err) {
    dispatch(setDoctorsError(extractError(err)));
  }
};

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to fetch doctors";
  }
  return "Something went wrong";
}

export const fetchDoctorsThunk =
  () =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setDoctorsLoading());
    try {
      const { data } = await api.get("/doctors");
      const doctors: Doctor[] = data.data;
      dispatch(setDoctorsSuccess(doctors));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDoctorsError(message));
      return { success: false, error: message };
    }
  };

export const createDoctorThunk =
  (payload: {
    name: string;
    email: string;
    password: string;
    specialty: string;
    department_id?: string;
  }) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; doctor?: Doctor; error?: string }> => {
    dispatch(setDoctorsLoading());
    try {
      const { data } = await api.post("/doctors", payload);
      const doctor: Doctor = data.data;
      dispatch(addDoctor(doctor));
      return { success: true, doctor };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDoctorsError(message));
      return { success: false, error: message };
    }
  };

export const updateDoctorThunk =
  (
    id: string,
    payload: {
      name?: string;
      specialty?: string;
      department_id?: string;
      status?: string;
    }
  ) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; doctor?: Doctor; error?: string }> => {
    dispatch(setDoctorsLoading());
    try {
      const { data } = await api.patch(`/doctors/${id}`, payload);
      const doctor: Doctor = data.data;
      dispatch(updateDoctor(doctor));
      return { success: true, doctor };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDoctorsError(message));
      return { success: false, error: message };
    }
  };

export const deleteDoctorThunk =
  (id: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setDoctorsLoading());
    try {
      await api.delete(`/doctors/${id}`);
      dispatch(removeDoctor(id));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDoctorsError(message));
      return { success: false, error: message };
    }
  };
