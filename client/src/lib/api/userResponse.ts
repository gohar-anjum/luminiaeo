/**
 * `GET /api/user` may return a raw Laravel user object or a wrapped `{ status, message, response }` shape.
 */
export function normalizeUserResponse(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {};
  }
  const o = json as Record<string, unknown>;
  if (
    typeof o.status === "number" &&
    o.response !== undefined &&
    typeof o.response === "object" &&
    o.response !== null
  ) {
    const r = o.response as Record<string, unknown>;
    if (r.user && typeof r.user === "object" && r.user !== null) {
      return r.user as Record<string, unknown>;
    }
  }
  if (o.user && typeof o.user === "object" && o.user !== null) {
    return o.user as Record<string, unknown>;
  }
  if (typeof o.id === "number" || typeof o.email === "string") {
    return o;
  }
  return o;
}
