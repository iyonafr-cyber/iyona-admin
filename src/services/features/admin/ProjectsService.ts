import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

export interface AdminProjectListItem {
  _id: string;
  name?: string;
  initialPrompt?: string;
  status?: string;
  stage?: string;
  stageStatus?: string;
  locked?: boolean;
  deletedAt?: string | null;
  previewUrl?: string | null;
  deployment?: {
    url?: string | null;
    status?: string;
    deployedAt?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    _id?: string;
    email?: string;
    role?: "user" | "admin";
  };
}

export interface AdminProjectListQuery {
  q?: string;
  ownerId?: string;
  status?: string;
  stage?: string;
  deleted?: "true" | "false";
  page?: number;
  pageSize?: number;
}

export interface AdminProjectListResponse {
  items: AdminProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProjectDetail {
  project: Record<string, unknown> & {
    _id: string;
    name?: string;
    deployment?: Record<string, unknown>;
    locked?: boolean;
    deletedAt?: string | null;
    /**
     * Scaffold-mode: name of the template this project was
     * materialized from (e.g. `'react-vite'`). Set by the backend at
     * create time when materialization succeeds. Absent on legacy projects.
     */
    templateName?: string;
    /** Pinned scaffold version at create time (e.g. `'1.0.0'`). */
    templateVersion?: string;
  };
  owner: (Record<string, unknown> & { _id: string; email: string }) | null;
  counts: { chats: number };
}

export interface AdminProjectPatch {
  takedown?: boolean;
  locked?: boolean;
  name?: string;
  reason?: string;
  // E5 — admin curation of public templates gallery.
  isTemplate?: boolean;
  templateCategory?: string;
  isPublic?: boolean;
}

/** One archived build: what the brain wrote, and what the agent was given. */
export interface AdminBuildArtifact {
  id: string;
  status: string | null;
  projectIdea: string | null;
  /** null for builds that ran before archiving shipped. */
  brief: string | null;
  agentPrompt: string | null;
  createdAt: string | null;
}

export class ProjectsService {
  static async list(
    query: AdminProjectListQuery = {},
  ): Promise<AdminProjectListResponse> {
    const params: Record<string, string | number> = {};
    if (query.q) params.q = query.q;
    if (query.ownerId) params.ownerId = query.ownerId;
    if (query.status) params.status = query.status;
    if (query.stage) params.stage = query.stage;
    if (query.deleted) params.deleted = query.deleted;
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    const res = await httpClient.get<{ data: AdminProjectListResponse }>(
      API_ENDPOINTS.ADMIN.PROJECTS,
      { params },
    );
    return res.data;
  }

  static async detail(id: string): Promise<AdminProjectDetail> {
    const res = await httpClient.get<{ data: AdminProjectDetail }>(
      API_ENDPOINTS.ADMIN.PROJECT(id),
    );
    return res.data;
  }

  /**
   * Archived build instructions for a project. Fetched on demand rather than
   * with `detail()` — each record runs to tens of KB.
   */
  static async buildArtifacts(id: string): Promise<AdminBuildArtifact[]> {
    const res = await httpClient.get<{ data: AdminBuildArtifact[] }>(
      API_ENDPOINTS.ADMIN.PROJECT_BUILD_ARTIFACTS(id),
    );
    return res.data ?? [];
  }

  static async patch(
    id: string,
    payload: AdminProjectPatch,
  ): Promise<AdminProjectDetail> {
    const res = await httpClient.patch<{ data: AdminProjectDetail }>(
      API_ENDPOINTS.ADMIN.PROJECT(id),
      payload,
    );
    return res.data;
  }

  static async softDelete(id: string, reason?: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.ADMIN.PROJECT(id), {
      data: { reason },
    });
  }
}
