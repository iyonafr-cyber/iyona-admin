import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export interface AuditLogRow {
  _id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: "user" | "project" | "model" | "credits" | "system";
  targetId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditQuery {
  actorId?: string;
  action?: string;
  targetType?: AuditLogRow["targetType"];
  targetId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditResponse {
  items: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

export class AuditService {
  static async list(query: AuditQuery = {}): Promise<AuditResponse> {
    const params: Record<string, string | number> = {};
    if (query.actorId) params.actorId = query.actorId;
    if (query.action) params.action = query.action;
    if (query.targetType) params.targetType = query.targetType;
    if (query.targetId) params.targetId = query.targetId;
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    const res = await httpClient.get<{ data: AuditResponse }>(
      API_ENDPOINTS.ADMIN.AUDIT,
      { params },
    );
    return res.data;
  }
}
