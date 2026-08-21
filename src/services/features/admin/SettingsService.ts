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
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsPatch {
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  /** null or '' resets to the server default. */
  cursorAgentModelId?: string | null;
}

export class SettingsService {
  static async get(): Promise<AdminSettings> {
    const res = await httpClient.get<{ data: AdminSettings }>(
      API_ENDPOINTS.ADMIN.SETTINGS,
    );
    return res.data;
  }

  /**
   * Ids Cursor will accept. Empty when Cursor is unreachable — the picker
   * degrades to a free-text field rather than blocking the settings page.
   */
  static async cursorModels(): Promise<string[]> {
    const res = await httpClient.get<{ data: string[] }>(
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
