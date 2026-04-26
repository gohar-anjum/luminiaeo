import { ApiError } from "@/lib/api/client";

/**
 * Best-effort message for admin API errors (Laravel 422 `errors`, or `message` / 402 / 403).
 */
export function getAdminErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.response && typeof e.response === "object") {
    const r = e.response as {
      message?: string;
      error?: string;
      error_code?: string;
      errors?: Record<string, string[] | string>;
    };
    if (r.errors) {
      for (const v of Object.values(r.errors)) {
        if (Array.isArray(v) && v[0]) return v[0];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
    if (typeof r.message === "string" && r.message.trim()) return r.message.trim();
    if (typeof r.error === "string" && r.error.trim()) return r.error.trim();
  }
  if (e instanceof Error && e.message.trim()) return e.message;
  return "Request failed";
}
