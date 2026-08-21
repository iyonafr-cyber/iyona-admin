import axios from "axios";

/**
 * Reads NestJS-style error bodies from failed axios requests so toasts show
 * the server message instead of "Request failed with status code 400".
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message !== undefined) {
      if (Array.isArray(data.message)) {
        return data.message.filter(Boolean).join(", ");
      }
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }
  }
  if (error instanceof Error && error.message && !/^Request failed with status code \d+$/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
