import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import RequireAdmin from "./RequireAdmin";
import RouteNames from "./RouteNames";
import AdminSidebarLayout from "../../components/layouts/AdminSidebarLayout";
import LoginPage from "../../pages/auth/LoginPage";
import DashboardPage from "../../pages/dashboard/DashboardPage";
import UsersListPage from "../../pages/users/UsersListPage";
import UserDetailPage from "../../pages/users/UserDetailPage";
import ProjectsListPage from "../../pages/projects/ProjectsListPage";
import ProjectDetailPage from "../../pages/projects/ProjectDetailPage";
import CreditsPage from "../../pages/credits/CreditsPage";
import ModelsListPage from "../../pages/models/ModelsListPage";
import TaskRoutesPage from "../../pages/task-routes/TaskRoutesPage";
import ProviderKeysPage from "../../pages/provider-keys/ProviderKeysPage";
import AuditLogPage from "../../pages/audit/AuditLogPage";
import SettingsPage from "../../pages/settings/SettingsPage";
import NotFoundPage from "../../pages/not-found/NotFoundPage";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path={RouteNames.LOGIN} element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <RequireAdmin>
              <AdminSidebarLayout />
            </RequireAdmin>
          </ProtectedRoute>
        }
      >
        <Route path={RouteNames.DASHBOARD} element={<DashboardPage />} />
        <Route path={RouteNames.USERS} element={<UsersListPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path={RouteNames.PROJECTS} element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path={RouteNames.CREDITS} element={<CreditsPage />} />
        <Route path={RouteNames.MODELS} element={<ModelsListPage />} />
        <Route path={RouteNames.TASK_ROUTES} element={<TaskRoutesPage />} />
        <Route path={RouteNames.PROVIDER_KEYS} element={<ProviderKeysPage />} />
        <Route path={RouteNames.AUDIT} element={<AuditLogPage />} />
        <Route path={RouteNames.SETTINGS} element={<SettingsPage />} />
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
