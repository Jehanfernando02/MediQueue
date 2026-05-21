import axios from "axios";
import api from "@/api/axiosClient";
import {
  setAdminLoading,
  setOverviewSuccess,
  setDeptLoadSuccess,
  setAuditLogsSuccess,
  setAdminError,
  setTrendsSuccess,
} from "@/store/slices/adminSlice";

import type { AppDispatch } from "@/store/store";

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || "Failed to fetch admin data";
  }
  return "Something went wrong";
}

export const fetchAdminOverviewThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setAdminLoading());
  try {
    const { data } = await api.get("/reports/overview");
    dispatch(setOverviewSuccess(data.data));
  } catch (err) {
    dispatch(setAdminError(extractError(err)));
  }
};

export const fetchDeptLoadThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setAdminLoading());
  try {
    const { data } = await api.get("/reports/department-load");
    dispatch(setDeptLoadSuccess(data.data));
  } catch (err) {
    dispatch(setAdminError(extractError(err)));
  }
};

export const fetchAuditLogsThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setAdminLoading());
  try {
    const { data } = await api.get("/audit");
    dispatch(setAuditLogsSuccess(data.data));
  } catch (err) {
    dispatch(setAdminError(extractError(err)));
  }
};

export const fetchTrendsThunk = () => async (dispatch: AppDispatch) => {
  dispatch(setAdminLoading());
  try {
    const { data } = await api.get("/reports/trends");
    dispatch(setTrendsSuccess(data.data));
  } catch (err) {
    dispatch(setAdminError(extractError(err)));
  }
};

export const exportReportThunk = (dateFrom?: string, dateTo?: string) => async (dispatch: AppDispatch) => {
  try {
    const response = await api.get("/reports/export", {
      params: { date_from: dateFrom, date_to: dateTo },
      responseType: "blob", // Important for file downloads
    });
    
    // Create a download link and click it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const filename = `appointments_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Export failed:", err);
    // Optionally dispatch error
  }
};

