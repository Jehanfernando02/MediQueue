/**
 * Department Thunks — async operations for departments
 */

import axios from "axios";
import api from "@/api/axiosClient";
import {
  setDepartmentsLoading,
  setDepartmentsSuccess,
  setDepartmentsError,
  addDepartment,
  updateDepartment,
  removeDepartment,
  type Department,
} from "@/store/slices/departmentSlice";
import type { AppDispatch } from "@/store/store";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to fetch departments";
  }
  return "Something went wrong";
}

export const fetchDepartmentsThunk =
  () =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setDepartmentsLoading());
    try {
      const { data } = await api.get("/departments");
      const departments: Department[] = data.data;
      dispatch(setDepartmentsSuccess(departments));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDepartmentsError(message));
      return { success: false, error: message };
    }
  };

export const createDepartmentThunk =
  (payload: { name: string; description?: string }) =>
  async (
    dispatch: AppDispatch
  ): Promise<{ success: boolean; department?: Department; error?: string }> => {
    dispatch(setDepartmentsLoading());
    try {
      const { data } = await api.post("/departments", payload);
      const department: Department = data.data;
      dispatch(addDepartment(department));
      return { success: true, department };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDepartmentsError(message));
      return { success: false, error: message };
    }
  };

export const updateDepartmentThunk =
  (id: string, payload: { name?: string; description?: string }) =>
  async (
    dispatch: AppDispatch
  ): Promise<{ success: boolean; department?: Department; error?: string }> => {
    dispatch(setDepartmentsLoading());
    try {
      const { data } = await api.patch(`/departments/${id}`, payload);
      const department: Department = data.data;
      dispatch(updateDepartment(department));
      return { success: true, department };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDepartmentsError(message));
      return { success: false, error: message };
    }
  };

export const deleteDepartmentThunk =
  (id: string) =>
  async (dispatch: AppDispatch): Promise<{ success: boolean; error?: string }> => {
    dispatch(setDepartmentsLoading());
    try {
      await api.delete(`/departments/${id}`);
      dispatch(removeDepartment(id));
      return { success: true };
    } catch (err) {
      const message = extractError(err);
      dispatch(setDepartmentsError(message));
      return { success: false, error: message };
    }
  };
