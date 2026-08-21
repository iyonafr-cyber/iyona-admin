import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "../authSlice";
import type { DashboardSnapshot } from "../../services/features/admin/DashboardService";

interface DashboardState {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: DashboardState = {
  snapshot: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
};

const slice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    dashboardPending: (state) => {
      state.loading = true;
      state.error = null;
    },
    dashboardFulfilled: (state, action: PayloadAction<DashboardSnapshot>) => {
      state.loading = false;
      state.snapshot = action.payload;
      state.lastFetchedAt = Date.now();
    },
    dashboardRejected: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { dashboardPending, dashboardFulfilled, dashboardRejected } =
  slice.actions;
export default slice.reducer;
