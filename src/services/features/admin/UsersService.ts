import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export interface AdminUserManualSubscription {
  planId: string;
  startedAt: string;
  expiresAt: string;
  months: number;
  amountPaidCents: number;
  currency: string;
  grantedBy: string;
  note: string | null;
}

export interface AdminUserListItem {
  _id: string;
  email: string;
  role: "user" | "admin";
  planId?: string;
  credits?: number;
  topUpCredits?: number;
  isVerified?: boolean;
  isDeleted?: boolean;
  isSuspended?: boolean;
  stripeSubscriptionId?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  manualSubscription?: AdminUserManualSubscription | null;
}

export interface AdminUserListQuery {
  q?: string;
  role?: "user" | "admin";
  planId?: string;
  isVerified?: boolean;
  isDeleted?: boolean;
  isSuspended?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUserDetail {
  user: AdminUserListItem & Record<string, unknown>;
  stats: {
    projectsCount: number;
    creditsBalance: number;
    topUpCredits: number;
    totalCredits: number;
  };
  recentProjects: Array<Record<string, unknown>>;
  recentLedger: Array<Record<string, unknown>>;
}

export interface AdminUserPatch {
  role?: "user" | "admin";
  planId?: string;
  isVerified?: boolean;
  isDeleted?: boolean;
  isSuspended?: boolean;
  reason?: string;
}

function boolParam(v: boolean | undefined): string | undefined {
  if (v === undefined) return undefined;
  return v ? "true" : "false";
}

export class UsersService {
  static async list(
    q: AdminUserListQuery = {},
  ): Promise<AdminUserListResponse> {
    const params: Record<string, string | number> = {};
    if (q.q) params.q = q.q;
    if (q.role) params.role = q.role;
    if (q.planId) params.planId = q.planId;
    const iv = boolParam(q.isVerified);
    const id = boolParam(q.isDeleted);
    const is = boolParam(q.isSuspended);
    if (iv !== undefined) params.isVerified = iv;
    if (id !== undefined) params.isDeleted = id;
    if (is !== undefined) params.isSuspended = is;
    if (q.from) params.from = q.from;
    if (q.to) params.to = q.to;
    if (q.page) params.page = q.page;
    if (q.pageSize) params.pageSize = q.pageSize;
    if (q.sort) params.sort = q.sort;
    const res = await httpClient.get<{ data: AdminUserListResponse }>(
      API_ENDPOINTS.ADMIN.USERS,
      { params },
    );
    return res.data;
  }

  static async detail(id: string): Promise<AdminUserDetail> {
    const res = await httpClient.get<{ data: AdminUserDetail }>(
      API_ENDPOINTS.ADMIN.USER(id),
    );
    return res.data;
  }

  static async patch(
    id: string,
    payload: AdminUserPatch,
  ): Promise<AdminUserDetail> {
    const res = await httpClient.patch<{ data: AdminUserDetail }>(
      API_ENDPOINTS.ADMIN.USER(id),
      payload,
    );
    return res.data;
  }

  static async forceLogout(id: string): Promise<void> {
    await httpClient.post(API_ENDPOINTS.ADMIN.USER_FORCE_LOGOUT(id), {});
  }

  static async resendVerification(
    id: string,
  ): Promise<{ sent: boolean; email: string }> {
    const res = await httpClient.post<{
      data: { sent: boolean; email: string };
    }>(API_ENDPOINTS.ADMIN.USER_RESEND_VERIFICATION(id), {});
    return res.data;
  }
}
