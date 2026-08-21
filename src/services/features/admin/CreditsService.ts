import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export type LedgerType =
  | "grant_monthly"
  | "grant_topup"
  | "charge_usage"
  | "refund_usage"
  | "admin_adjust"
  | "reset_monthly";

export interface LedgerRow {
  _id: string;
  userId: string;
  userEmail: string | null;
  type: LedgerType;
  amount: number;
  balanceAfter?: number;
  balanceAfterTopup?: number;
  reason?: string | null;
  reference?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LedgerQuery {
  userId?: string;
  type?: LedgerType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface LedgerResponse {
  items: LedgerRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TopSpenderRow {
  userId: string;
  email: string | null;
  requests: number;
  totalCostUsd: number;
  totalCreditsCharged: number;
}

export interface AdjustPayload {
  userId: string;
  amount: number;
  bucket?: "monthly" | "topup";
  reason: string;
}

export interface CreditBalance {
  credits: number;
  topUpCredits: number;
  totalCredits: number;
  planId?: string;
  creditsRenewAt?: string;
}

export interface MarginSummary {
  window: string;
  totalCreditsCharged: number;
  totalCostUsd: number;
  creditsPerUsdImplied: number;
  byModel: Array<{
    model: string;
    provider: string;
    requests: number;
    credits: number;
    costUsd: number;
  }>;
}

export class CreditsService {
  static async ledger(query: LedgerQuery = {}): Promise<LedgerResponse> {
    const params: Record<string, string | number> = {};
    if (query.userId) params.userId = query.userId;
    if (query.type) params.type = query.type;
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    const res = await httpClient.get<{ data: LedgerResponse }>(
      API_ENDPOINTS.ADMIN.CREDITS_LEDGER,
      { params },
    );
    return res.data;
  }

  static async topSpenders(
    days = 30,
    limit = 10,
  ): Promise<TopSpenderRow[]> {
    const res = await httpClient.get<{ data: TopSpenderRow[] }>(
      API_ENDPOINTS.ADMIN.CREDITS_TOP_SPENDERS,
      { params: { days, limit } },
    );
    return res.data;
  }

  static async adjust(payload: AdjustPayload): Promise<CreditBalance> {
    const res = await httpClient.post<{ data: CreditBalance }>(
      API_ENDPOINTS.ADMIN.CREDITS_ADJUST,
      payload,
    );
    return res.data;
  }

  static async margin(days = 30): Promise<MarginSummary> {
    const res = await httpClient.get<{ data: MarginSummary }>(
      API_ENDPOINTS.ADMIN.CREDITS_MARGIN,
      { params: { days } },
    );
    return res.data;
  }
}
