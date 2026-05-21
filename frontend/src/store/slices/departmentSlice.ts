/**
 * Department Slice — manages department list
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DepartmentState {
  departments: Department[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DepartmentState = {
  departments: [],
  status: "idle",
  error: null,
};

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    setDepartmentsLoading(state) {
      state.status = "loading";
      state.error = null;
    },

    setDepartmentsSuccess(state, action: PayloadAction<Department[]>) {
      state.departments = action.payload;
      state.status = "succeeded";
    },

    setDepartmentsError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    addDepartment(state, action: PayloadAction<Department>) {
      state.departments.push(action.payload);
    },

    updateDepartment(state, action: PayloadAction<Department>) {
      const idx = state.departments.findIndex((d) => d.id === action.payload.id);
      if (idx >= 0) state.departments[idx] = action.payload;
    },

    removeDepartment(state, action: PayloadAction<string>) {
      state.departments = state.departments.filter((d) => d.id !== action.payload);
    },

    clearDepartmentError(state) {
      state.error = null;
    },
  },
});

export const {
  setDepartmentsLoading,
  setDepartmentsSuccess,
  setDepartmentsError,
  addDepartment,
  updateDepartment,
  removeDepartment,
  clearDepartmentError,
} = departmentSlice.actions;

export default departmentSlice.reducer;

// Selectors
type SliceState = { department: DepartmentState };

export const selectDepartments = (s: SliceState) => s.department.departments;
export const selectDepartmentStatus = (s: SliceState) => s.department.status;
export const selectDepartmentError = (s: SliceState) => s.department.error;
