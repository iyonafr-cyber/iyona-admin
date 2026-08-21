/**
 * Admin-only REST endpoints. Mirrors the routes exposed by jarvis-backend
 * under `/admin/*` plus the minimal auth + user routes we need for the
 * admin login flow.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
  },
  USER: {
    PROFILE: "/user",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    USER: (id: string) => `/admin/users/${id}`,
    USER_FORCE_LOGOUT: (id: string) => `/admin/users/${id}/force-logout`,
    USER_RESEND_VERIFICATION: (id: string) =>
      `/admin/users/${id}/resend-verification`,
    USER_MANUAL_SUBSCRIPTION: (id: string) =>
      `/admin/users/${id}/manual-subscription`,
    PROJECTS: "/admin/projects",
    PROJECT: (id: string) => `/admin/projects/${id}`,
    CREDITS_LEDGER: "/admin/credits/ledger",
    CREDITS_TOP_SPENDERS: "/admin/credits/top-spenders",
    CREDITS_ADJUST: "/admin/credits/adjust",
    CREDITS_MARGIN: "/credits/admin/margin",
    MODELS: "/admin/models",
    MODEL: (id: string) => `/admin/models/${id}`,
    MODELS_REFRESH: "/admin/models/refresh",
    TASK_ROUTES: "/admin/task-routes",
    TASK_ROUTE: (task: string) => `/admin/task-routes/${task}`,
    AI_PROVIDER_KEYS: "/admin/ai-provider-keys",
    AI_PROVIDER_KEY: (id: string) => `/admin/ai-provider-keys/${id}`,
    AI_PROVIDER_KEY_TEST: (id: string) => `/admin/ai-provider-keys/${id}/test`,
    AUDIT: "/admin/audit",
    SETTINGS: "/admin/settings",
    /** Model ids the Cursor coding agent accepts (not catalogue ids). */
    CURSOR_MODELS: "/admin/cursor/models",
  },
  SYSTEM: {
    STATUS: "/system/status",
  },
};
