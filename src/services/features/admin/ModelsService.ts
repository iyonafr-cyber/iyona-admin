import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export type ModelTier = "high" | "medium" | "low";
export type ModelProvider = "openai" | "anthropic" | "google";
export type ModelCategory = "coding" | "image" | "content";

export const MODEL_CATEGORIES: ReadonlyArray<ModelCategory> = [
  "coding",
  "image",
  "content",
];

export interface AdminModel {
  modelId: string;
  displayName: string;
  provider: ModelProvider;
  tier: ModelTier;
  category: ModelCategory;
  isDefault: boolean;
  order: number;
  enabled: boolean;
  inputPerMillion: number;
  outputPerMillion: number;
  maxOutputTokens: number;
  contextTokens: number;
  codingOptimized: boolean;
  deprecatedAt?: string | null;
  lastSeenAt?: string | null;
  /**
   * Provider publish date, captured during catalog refresh. Absent for Google
   * (its list endpoint reports none) and for rows added before the column
   * existed that haven't been refreshed since.
   */
  releasedAt?: string | null;
}

export interface UpdateModelPayload {
  enabled?: boolean;
  displayName?: string;
  order?: number;
  isDefault?: boolean;
  inputPerMillion?: number;
  outputPerMillion?: number;
  maxOutputTokens?: number;
  contextTokens?: number;
  tier?: ModelTier;
  category?: ModelCategory;
  codingOptimized?: boolean;
}

export interface RefreshSummary {
  added: string[];
  updatedLastSeen: string[];
  skipped: string[];
  /** Newly marked deprecated — their provider answered but didn't list them. */
  deprecated: string[];
  /** Listed again by their provider; deprecation was cleared. */
  restored: string[];
  /** The subset of `deprecated` that was still enabled — needs an admin. */
  stale: string[];
}

export class ModelsService {
  static async list(): Promise<AdminModel[]> {
    const res = await httpClient.get<{ data: AdminModel[] }>(
      API_ENDPOINTS.ADMIN.MODELS,
    );
    return res.data;
  }

  static async update(
    modelId: string,
    payload: UpdateModelPayload,
  ): Promise<AdminModel> {
    const res = await httpClient.patch<{ data: AdminModel }>(
      API_ENDPOINTS.ADMIN.MODEL(modelId),
      payload,
    );
    return res.data;
  }

  static async refresh(): Promise<RefreshSummary> {
    const res = await httpClient.post<{ data: RefreshSummary }>(
      API_ENDPOINTS.ADMIN.MODELS_REFRESH,
      {},
    );
    return res.data;
  }
}
