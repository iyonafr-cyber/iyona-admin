import type { AxiosInstance } from "axios";

/** Shared request config for the thin JSON http client (both SPAs). */
export interface JarvisHttpClientConfig {
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
  config?: JarvisHttpClientConfig,
): Promise<T> {
  if (data) {
    validateJsonSerializable(data);
  }
  return instance[method]<T>(url, data, config).then((res) => res.data);
}

export interface JarvisHttpClient {
  get: <T>(url: string, config?: JarvisHttpClientConfig) => Promise<T>;
  post: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) => Promise<T>;
  put: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) => Promise<T>;
  patch: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) => Promise<T>;
  delete: <T>(url: string, config?: JarvisHttpClientConfig) => Promise<T>;
}

/** Returns `res.data` helpers around the shared axios instance (JSON validate on mutating bodies). */
export function createHttpClient(axiosInstance: AxiosInstance): JarvisHttpClient {
  return {
    get: <T>(url: string, config?: JarvisHttpClientConfig) =>
      axiosInstance.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "post", url, data, config),

    put: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "put", url, data, config),

    patch: <T>(url: string, data?: object, config?: JarvisHttpClientConfig) =>
      requestWithJsonBody<T>(axiosInstance, "patch", url, data, config),

    delete: <T>(url: string, config?: JarvisHttpClientConfig) =>
      axiosInstance.delete<T>(url, config).then((res) => res.data),
  };
}
