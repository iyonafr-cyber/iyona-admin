import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export interface AdminSettings {
  _id: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  /**
   * Model the Cursor agent writes code with. NOT a model-catalogue id — the
   * catalogue drives planning (validation, questionnaires, build spec) while
   * Cursor authors the code, and the two namespaces are separate.
   * null → the server's CURSOR_AGENT_MODEL_ID default.
   */
  cursorAgentModelId: string | null;
  /**
   * Model params (effort/reasoning/thinking/fast) as {paramId: value}. Only
   * applied when cursorAgentModelId is set; null → the model's own defaults.
   */
  cursorAgentModelParams: Record<string, string> | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsPatch {
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  /** null or '' resets to the server default. */
  cursorAgentModelId?: string | null;
  /** {paramId: value} picked from the live catalogue; null clears. */
  cursorAgentModelParams?: Record<string, string> | null;
}

/** One permitted value of a Cursor model parameter. */
export interface CursorModelParamValue {
  value: string;
  displayName?: string;
}

/** A parameter a Cursor model accepts (effort, reasoning, thinking, fast…). */
export interface CursorModelParameter {
  id: string;
  displayName?: string;
  values: CursorModelParamValue[];
}

/** One entry of Cursor's live model catalogue. */
export interface CursorAgentModel {
  id: string;
  displayName?: string;
  parameters: CursorModelParameter[];
}

export class SettingsService {
  static async get(): Promise<AdminSettings> {
    const res = await httpClient.get<{ data: AdminSettings }>(
      API_ENDPOINTS.ADMIN.SETTINGS,
    );
    return res.data;
  }

  /**
   * Cursor's live model catalogue — ids, display names, and each model's
   * parameters (effort/reasoning/…) with permitted values, so the picker is
   * always current. Empty when Cursor is unreachable — the picker degrades to
   * a free-text field rather than blocking the settings page.
   */
  static async cursorModels(): Promise<CursorAgentModel[]> {
    const res = await httpClient.get<{ data: CursorAgentModel[] }>(
      API_ENDPOINTS.ADMIN.CURSOR_MODELS,
    );
    return res.data ?? [];
  }

  static async patch(payload: SettingsPatch): Promise<AdminSettings> {
    const res = await httpClient.patch<{ data: AdminSettings }>(
      API_ENDPOINTS.ADMIN.SETTINGS,
      payload,
    );
    return res.data;
  }
}
