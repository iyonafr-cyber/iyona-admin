import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import type { JarvisTokenStore } from "./token-store.js";

export interface JarvisAuthInterceptorOptions {
  baseURL: string;
  tokenStore: JarvisTokenStore;
  loginPath: string;
  /** URL substrings for requests that must not trigger the 401 refresh loop. */
  authUrlsThatSkipRefresh: readonly string[];
}

export function isAuthRefreshSkipUrl(
  url: string | undefined,
  skipList: readonly string[],
): boolean {
  if (!url) return false;
  return skipList.some((suffix) => url.includes(suffix));
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Attach `Authorization: Bearer <access>` from the token store on every request. */
export function attachBearerRequestInterceptor(
  instance: AxiosInstance,
  tokenStore: JarvisTokenStore,
): void {
  instance.interceptors.request.use(
    (config) => {
      const token = tokenStore.getAccessToken();
      if (token) {
        config.headers = config.headers ?? new AxiosHeaders();
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
}

/**
 * Returns an error interceptor that performs single-flight refresh + retry on 401.
 * Use as the second argument to `axiosInstance.interceptors.response.use`.
 */
export function create401RefreshErrorInterceptor(
  instance: AxiosInstance,
  options: JarvisAuthInterceptorOptions,
): (error: AxiosError) => Promise<unknown> {
  const { baseURL, tokenStore, loginPath, authUrlsThatSkipRefresh } = options;
  let refreshPromise: Promise<string> | null = null;

  async function performTokenRefresh(): Promise<string> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      `${baseURL}/auth/refresh-token`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        timeout: 15000,
      },
    );

    const body = response.data?.data ?? response.data;
    const newAccessToken: string | undefined = body?.accessToken;
    const newRefreshToken: string | undefined = body?.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error("Refresh response missing tokens");
    }

    tokenStore.setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  }

  function clearAndRedirect(): void {
    tokenStore.clearTokens();
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== loginPath
    ) {
      window.location.href = loginPath;
    }
  }

  return async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !original ||
      original._retried ||
      isAuthRefreshSkipUrl(original.url, authUrlsThatSkipRefresh)
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      original.headers = original.headers ?? new AxiosHeaders();
      (original.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${newAccessToken}`,
      );
      return instance(original);
    } catch (refreshError) {
      clearAndRedirect();
      return Promise.reject(refreshError);
    }
  };
}
