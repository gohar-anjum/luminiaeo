export const EMAIL_UNVERIFIED_EVENT = "luminia:email-unverified";

export function dispatchEmailUnverifiedEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EMAIL_UNVERIFIED_EVENT));
}

/**
 * Triggers a global event so the app can send the user to the verify screen.
 * Expects JSON like `{ "status": 403, "message": "...", "response": { "code": "EMAIL_UNVERIFIED" } }`.
 */
export function tryDispatchEmailUnverified(status: number, body: unknown): void {
  if (status !== 403) return;
  if (!body || typeof body !== "object") return;
  const code = (body as { response?: { code?: string } | null }).response?.code;
  if (code === "EMAIL_UNVERIFIED") {
    dispatchEmailUnverifiedEvent();
  }
}
