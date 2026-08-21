import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export type AiProviderKeyProvider = "openai" | "anthropic" | "google";

export type AiProviderKeyHealthStatus =
  | "healthy"
  | "rate_limited"
  | "quota_exceeded"
  | "disabled"
  | "invalid";

export interface AdminProviderKey {
  _id: string;
  provider: AiProviderKeyProvider;
  name: string;
  keyPreview: string;
  isActive: boolean;
  priority: number;
  supportedModels: string[];
  healthStatus: AiProviderKeyHealthStatus;
  lastFailureAt?: string | null;
  lastFailureReason?: string | null;
  totalRequests: number;
  requestsToday: number;
  requestsThisMinute: number;
  openaiBaseUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProviderKeyPayload {
  provider: AiProviderKeyProvider;
  name: string;
  apiKey: string;
  isActive?: boolean;
  priority?: number;
  supportedModels?: string[];
  openaiBaseUrl?: string;
}

export interface UpdateProviderKeyPayload {
  name?: string;
  isActive?: boolean;
  priority?: number;
  supportedModels?: string[];
  apiKey?: string;
  openaiBaseUrl?: string | null;
  healthStatus?: AiProviderKeyHealthStatus;
}

export interface TestKeyResult {
  ok: boolean;
  message: string;
}

export class AiProviderKeysService {
  static async list(): Promise<AdminProviderKey[]> {
    const res = await httpClient.get<{ data: AdminProviderKey[] }>(
      API_ENDPOINTS.ADMIN.AI_PROVIDER_KEYS,
    );
    return res.data;
  }

  static async create(payload: CreateProviderKeyPayload): Promise<AdminProviderKey> {
    const res = await httpClient.post<{ data: AdminProviderKey }>(
      API_ENDPOINTS.ADMIN.AI_PROVIDER_KEYS,
      payload,
    );
    return res.data;
  }

  static async update(
    id: string,
    payload: UpdateProviderKeyPayload,
  ): Promise<AdminProviderKey> {
    const res = await httpClient.patch<{ data: AdminProviderKey }>(
      API_ENDPOINTS.ADMIN.AI_PROVIDER_KEY(id),
      payload,
    );
    return res.data;
  }

  static async remove(id: string): Promise<void> {
    await httpClient.delete<{ data: { deleted: boolean } }>(
      API_ENDPOINTS.ADMIN.AI_PROVIDER_KEY(id),
    );
  }

  static async test(id: string): Promise<TestKeyResult> {
    const res = await httpClient.post<{ data: TestKeyResult }>(
      API_ENDPOINTS.ADMIN.AI_PROVIDER_KEY_TEST(id),
      {},
    );
    return res.data;
  }
}
