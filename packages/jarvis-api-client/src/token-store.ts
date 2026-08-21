/** Token persistence used by Jarvis auth interceptors (localStorage in both SPAs). */
export interface JarvisTokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
}
