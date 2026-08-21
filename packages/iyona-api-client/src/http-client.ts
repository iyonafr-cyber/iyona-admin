import type { AxiosInstance } from "axios";

/** Shared request config for the thin JSON http client (both SPAs). */
export interface IyonaHttpClientConfig {
  params?: object;
  timeout?: number;
  signal?: AbortSignal;
  /** Supported on DELETE for endpoints that carry a JSON body (e.g. soft-delete with reason). */
  data?: unknown;
}

function validateJsonSerializable(data: unknown): void {
  try {
    const jsonString = JSON.stringify(data);
    JSON.parse(jsonString);
  } catch (error) {
    console.error("[httpClient] JSON serialization error:", error);
    console.error("[httpClient] Problematic data:", data);
    throw new Error(
      `Invalid JSON data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

type BodyMethod = "post" | "put" | "patch";

function requestWithJsonBody<T>(
  instance: AxiosInstance,
  method: BodyMethod,
  url: string,
  data?: object,
  config?: IyonaHttpClientConfig,
): Promise<T> {
  if (data) {
    validateJsonSerializable(data);
  }
  return instance[method]<T>(url, data, config).then((res) => res.data);
}

export interface IyonaHttpClient {
  get: <T>(url: string, config?: IyonaHttpClientConfig) => Promise<T>;
  post: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) => Promise<T>;
  put: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) => Promise<T>;
  patch: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) => Promise<T>;
  delete: <T>(url: string, config?: IyonaHttpClientConfig) => Promise<T>;
}

/** Returns `res.data` helpers around the shared axios instance (JSON validate on mutating bodies). */
export function createHttpClient(axiosInstance: AxiosInstance): IyonaHttpClient {
  return {
    get: <T>(url: string, config?: IyonaHttpClientConfig) =>
      axiosInstance.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "post", url, data, config),

    put: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "put", url, data, config),

    patch: <T>(url: string, data?: object, config?: IyonaHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "patch", url, data, config),

    delete: <T>(url: string, config?: IyonaHttpClientConfig) =>
      axiosInstance.delete<T>(url, config).then((res) => res.data),
  };
}
