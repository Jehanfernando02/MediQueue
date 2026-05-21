import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SystemOverview {
  patients_today: number;
  active_doctors: number;
  status_summary: Record<string, number>;
  system_health: string;
}

export interface DepartmentLoad {
  department: string;
  count: number;
}

export interface TrendEntry {
  month: string;
  visits: number;
  load: number;
}

export interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  metadata: any;
}

export interface AdminState {
  overview: SystemOverview | null;
  deptLoad: DepartmentLoad[];
  auditLogs: AuditEntry[];
  trends: TrendEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminState = {
  overview: null,
  deptLoad: [],
  auditLogs: [],
  trends: [],
  status: "idle",
  error: null,
};


const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setOverviewSuccess(state, action: PayloadAction<SystemOverview>) {
      state.overview = action.payload;
      state.status = "succeeded";
    },
    setDeptLoadSuccess(state, action: PayloadAction<DepartmentLoad[]>) {
      state.deptLoad = action.payload;
      state.status = "succeeded";
    },
    setAuditLogsSuccess(state, action: PayloadAction<AuditEntry[]>) {
      state.auditLogs = action.payload;
      state.status = "succeeded";
    },
    setTrendsSuccess(state, action: PayloadAction<TrendEntry[]>) {
      state.trends = action.payload;
      state.status = "succeeded";
    },

    setAdminError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  setAdminLoading,
  setOverviewSuccess,
  setDeptLoadSuccess,
  setAuditLogsSuccess,
  setAdminError,
  setTrendsSuccess,
} = adminSlice.actions;


export default adminSlice.reducer;

// Selectors
type SliceState = { admin: AdminState };
export const selectAdminOverview = (s: SliceState) => s.admin.overview;
export const selectDeptLoad = (s: SliceState) => s.admin.deptLoad;
export const selectAuditLogs = (s: SliceState) => s.admin.auditLogs;
export const selectAdminStatus = (s: SliceState) => s.admin.status;
export const selectAdminError = (s: SliceState) => s.admin.error;
export const selectTrends = (s: SliceState) => s.admin.trends;


