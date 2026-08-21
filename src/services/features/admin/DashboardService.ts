import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  error: string | null;
  data: T;
}

export interface DashboardSnapshot {
  totals: {
    users: number;
    admins: number;
    activeSubscriptions: number;
    projects: number;
    deployedProjects: number;
  };
  today: {
    signups: number;
    creditsConsumed: number;
    providerSpendUsd: number;
    failedGenerations: number;
  };
  timeseries: {
    signupsLast30d: Array<{ date: string; value: number }>;
    creditsConsumedLast30d: Array<{ date: string; value: number }>;
    providerSpendUsdLast30d: Array<{ date: string; value: number }>;
  };
  margin30d: {
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
  } | null;
  providerHealth: Record<
    string,
    {
      lastSuccessAt: string | null;
      lastFailureAt: string | null;
      successes24h: number;
      failures24h: number;
    }
  >;
}

export class DashboardService {
  static async snapshot(): Promise<DashboardSnapshot> {
    const res = await httpClient.get<{ data: DashboardSnapshot }>(
      API_ENDPOINTS.ADMIN.DASHBOARD,
    );
    return res.data;
  }
}
