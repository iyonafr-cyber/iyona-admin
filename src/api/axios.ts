import axios from "axios";
import {
  attachBearerRequestInterceptor,
  create401RefreshErrorInterceptor,
} from "@jarvis/api-client";
import { LocalStorageService } from "../services/local_storage/LocalStorageService";
import RouteNames from "../utils/routing/RouteNames";

const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment
  ? import.meta.env.VITE_LOCAL_HOST_API_BASE_URL
  : import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_URLS_THAT_SKIP_REFRESH = [
  "/auth/refresh-token",
  "/auth/login",
  "/auth/logout",
] as const;

const tokenStore = {
  getAccessToken: () => LocalStorageService.getAccessToken(),
  getRefreshToken: () => LocalStorageService.getRefreshToken(),
  setTokens: (accessToken: string, refreshToken: string) => {
    LocalStorageService.setAccessToken(accessToken);
    LocalStorageService.setRefreshToken(refreshToken);
  },
  clearTokens: () => LocalStorageService.clearTokens(),
};

attachBearerRequestInterceptor(axiosInstance, tokenStore);

axiosInstance.interceptors.response.use(
  (response) => response,
  create401RefreshErrorInterceptor(axiosInstance, {
    baseURL,
    tokenStore,
    loginPath: RouteNames.LOGIN,
    authUrlsThatSkipRefresh: AUTH_URLS_THAT_SKIP_REFRESH,
  }),
);

export default axiosInstance;
