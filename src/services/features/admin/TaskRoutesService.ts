import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";
import type { ModelProvider } from "./ModelsService";

export type RouterTaskName =
  | "classify"
  | "plan"
  | "codegen"
  | "codegen_stream"
  | "reason"
  | "extract";

export type CandidateReason =
  | "ok"
  | "unknown_model"
  | "model_disabled"
  | "model_deprecated"
  | "provider_unavailable";

export type EffectiveSource =
  | "taskRoutePrimary"
  | "taskRouteFallback"
  | "globalDefault"
  | "legacyTable";

export interface TaskRouteCandidate {
  modelId: string;
  displayName: string | null;
  provider: ModelProvider | null;
  role: "primary" | "fallback";
  available: boolean;
  reason: CandidateReason;
}

export interface TaskRoute {
  task: RouterTaskName;
  description: string;
  primaryModelId: string | null;
  fallbackModelIds: string[];
  enforce: boolean;
  enabled: boolean;
  candidates: TaskRouteCandidate[];
  /** What this task resolves to right now, given live provider health. */
  effectiveModelId: string | null;
  effectiveSource: EffectiveSource;
}

export interface UpdateTaskRoutePayload {
  primaryModelId?: string | null;
  fallbackModelIds?: string[];
  enforce?: boolean;
  enabled?: boolean;
}

export class TaskRoutesService {
  static async list(): Promise<TaskRoute[]> {
    const res = await httpClient.get<{ data: TaskRoute[] }>(
      API_ENDPOINTS.ADMIN.TASK_ROUTES,
    );
    return res.data;
  }

  static async update(
    task: RouterTaskName,
    payload: UpdateTaskRoutePayload,
  ): Promise<TaskRoute> {
    const res = await httpClient.patch<{ data: TaskRoute }>(
      API_ENDPOINTS.ADMIN.TASK_ROUTE(task),
      payload,
    );
    return res.data;
  }
}
