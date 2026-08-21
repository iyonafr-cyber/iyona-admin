/** Token persistence used by Iyona auth interceptors (localStorage in both SPAs). */
export interface IyonaTokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
}
