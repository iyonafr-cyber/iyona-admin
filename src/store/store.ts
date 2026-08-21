import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import themeReducer from "./themeSlice";
import languageReducer from "./languageSlice";
import dashboardReducer from "./slices/dashboardSlice";
import { logoutListenerMiddleware } from "./logoutListener";

// TODO(cleanup): `adminDashboard` slice is registered here but no actions
// are dispatched and no selectors read `state.adminDashboard` — the
// DashboardPage loads via `useAsync` + `DashboardService` instead. Either
// migrate the page onto Redux or drop the slice and this reducer key on
// the next cleanup pass. Left in place for now to avoid touching the
// store typing without a product decision.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    language: languageReducer,
    adminDashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(logoutListenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
