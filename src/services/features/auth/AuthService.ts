import { API_ENDPOINTS } from "../../../api/endpoints";
import { httpClient } from "../../../api/httpClient";
import { LocalStorageService } from "../../local_storage/LocalStorageService";
import type { AuthUser } from "../../../store/authSlice";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface LoginResponseData extends AuthUser {
  accessToken: string | null;
  refreshToken: string | null;
}

export class AuthService {
  static async loginUser(
    payload: LoginPayload,
  ): Promise<LoginResponseData> {
    try {
      const response = await httpClient.post<AuthResponse<LoginResponseData>>(
        API_ENDPOINTS.AUTH.LOGIN,
        payload,
      );
      if (response.statusCode !== 200) {
        throw new Error(response.message || "Login failed");
      }
      const userData = response.data;
      if (userData.accessToken && userData.refreshToken) {
        LocalStorageService.setAccessToken(userData.accessToken);
        LocalStorageService.setRefreshToken(userData.refreshToken);
      }
      return userData;
    } catch (error) {
      LocalStorageService.clearTokens();
      throw error;
    }
  }

  static async getProfile(): Promise<AuthUser> {
    const response = await httpClient.get<AuthResponse<AuthUser>>(
      API_ENDPOINTS.USER.PROFILE,
    );
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      const refreshToken = LocalStorageService.getRefreshToken();
      if (!refreshToken) {
        LocalStorageService.clearTokens();
        return;
      }
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch {
      /* ignore – we still clear client-side tokens */
    } finally {
      LocalStorageService.clearTokens();
    }
  }
}
