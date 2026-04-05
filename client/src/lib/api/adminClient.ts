import { getApiUrl } from "@/lib/apiConfig";
import { ApiError } from "@/lib/api/client";
import type {
  AdminActivityAnalysisQuery,
  AdminActivityCatalogResponse,
  AdminActivityCitationTaskRow,
  AdminActivityClusterJobRow,
  AdminActivityContentOutlineRow,
  AdminActivityFaqTaskRow,
  AdminActivityKeywordResearchRow,
  AdminActivityListResponse,
  AdminActivityMetaAnalysisRow,
  AdminActivityPbnQuery,
  AdminActivityPbnRow,
  AdminActivitySemanticAnalysisRow,
  AdminActivityStoredFaqRow,
  AdminActivityTaskQuery,
  AdminAnnouncement,
  AdminBillableFeatureRow,
  AdminFeatureCreateBody,
  AdminFeaturePatchBody,
  AdminFeaturesListResponse,
  AdminApiLogsQuery,
  AdminApiLogsResponse,
  AdminBacklinkRow,
  AdminBacklinksListResponse,
  AdminBacklinksQuery,
  AdminCacheClearResponse,
  AdminClusterSnapshotsResponse,
  AdminClustersListResponse,
  AdminClustersQuery,
  AdminCreditTransactionsQuery,
  AdminCreditTransactionsResponse,
  AdminDashboardCharts,
  AdminDashboardStats,
  AdminSubscriptionRow,
  AdminSubscriptionsListResponse,
  AdminSubscriptionsQuery,
  AdminSystemHealth,
  AdminUserDetail,
  AdminUserRow,
  AdminUsersListResponse,
  AdminUsersQuery,
} from "./adminTypes";

function authToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authToken();
  if (!token) {
    throw new ApiError("Not authenticated", 401);
  }

  const url = path.startsWith("http") ? path : getApiUrl(path.startsWith("/") ? path : `/${path}`);

  const method = init?.method ?? "GET";
  const body = init?.body;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }
  if (init?.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body,
    credentials: "include",
  });

  const text = await res.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text.slice(0, 200) };
    }
  }

  if (!res.ok) {
    const msg =
      parsed && typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message: string }).message)
        : res.statusText;
    throw new ApiError(msg || "Request failed", res.status, parsed);
  }

  if (res.status === 204 || text === "") {
    return undefined as T;
  }

  return parsed as T;
}

/** CSV (or other) export — triggers browser download. */
export async function adminDownload(pathWithQuery: string): Promise<void> {
  const token = authToken();
  if (!token) {
    throw new ApiError("Not authenticated", 401);
  }
  const url = pathWithQuery.startsWith("http")
    ? pathWithQuery
    : getApiUrl(pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,application/json;q=0.9,*/*;q=0.8",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.clone().json();
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status);
  }

  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  let filename = "export.csv";
  if (dispo) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i.exec(dispo);
    if (m) filename = decodeURIComponent(m[1].replace(/["']/g, "").trim());
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export const adminApi = {
  getDashboardStats(): Promise<AdminDashboardStats> {
    return adminFetch("/api/admin/dashboard/stats");
  },

  getDashboardCharts(): Promise<AdminDashboardCharts> {
    return adminFetch("/api/admin/dashboard/charts");
  },

  getUsers(q: AdminUsersQuery = {}): Promise<AdminUsersListResponse> {
    return adminFetch(`/api/admin/users${toQueryString(q)}`);
  },

  getUser(id: number, opts?: { include_product_activity?: boolean }): Promise<AdminUserDetail> {
    const q =
      opts?.include_product_activity === true ? "?include_product_activity=1" : "";
    return adminFetch(`/api/admin/users/${id}${q}`);
  },

  getActivityCatalog(): Promise<AdminActivityCatalogResponse> {
    return adminFetch("/api/admin/activity/catalog");
  },

  getActivityFaqTasks(
    q: AdminActivityTaskQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityFaqTaskRow>> {
    return adminFetch(`/api/admin/activity/faq-tasks${toQueryString(q)}`);
  },

  getActivityCitationTasks(
    q: AdminActivityTaskQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityCitationTaskRow>> {
    return adminFetch(`/api/admin/activity/citation-tasks${toQueryString(q)}`);
  },

  getActivityKeywordResearch(
    q: AdminActivityTaskQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityKeywordResearchRow>> {
    return adminFetch(`/api/admin/activity/keyword-research${toQueryString(q)}`);
  },

  getActivityMetaAnalyses(
    q: AdminActivityAnalysisQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityMetaAnalysisRow>> {
    return adminFetch(`/api/admin/activity/meta-analyses${toQueryString(q)}`);
  },

  getActivitySemanticAnalyses(
    q: AdminActivityAnalysisQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivitySemanticAnalysisRow>> {
    return adminFetch(`/api/admin/activity/semantic-analyses${toQueryString(q)}`);
  },

  getActivityContentOutlines(
    q: AdminActivityAnalysisQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityContentOutlineRow>> {
    return adminFetch(`/api/admin/activity/content-outlines${toQueryString(q)}`);
  },

  getActivityFaqs(
    q: AdminActivityAnalysisQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityStoredFaqRow>> {
    return adminFetch(`/api/admin/activity/faqs${toQueryString(q)}`);
  },

  getActivityPbnDetections(
    q: AdminActivityPbnQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityPbnRow>> {
    return adminFetch(`/api/admin/activity/pbn-detections${toQueryString(q)}`);
  },

  getActivityClusterJobs(
    q: AdminActivityTaskQuery = {},
  ): Promise<AdminActivityListResponse<AdminActivityClusterJobRow>> {
    return adminFetch(`/api/admin/activity/cluster-jobs${toQueryString(q)}`);
  },

  suspendUser(id: number): Promise<AdminUserRow> {
    return adminFetch(`/api/admin/users/${id}/suspend`, { method: "POST", body: "{}" });
  },

  unsuspendUser(id: number): Promise<AdminUserRow> {
    return adminFetch(`/api/admin/users/${id}/unsuspend`, { method: "POST", body: "{}" });
  },

  adjustCredits(id: number, amount: number): Promise<AdminUserRow> {
    return adminFetch(`/api/admin/users/${id}/adjust-credits`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  getBacklinks(q: AdminBacklinksQuery = {}): Promise<AdminBacklinksListResponse> {
    return adminFetch(`/api/admin/backlinks${toQueryString(q)}`);
  },

  getBacklink(id: number): Promise<AdminBacklinkRow> {
    return adminFetch(`/api/admin/backlinks/${id}`);
  },

  deleteBacklink(id: number): Promise<void> {
    return adminFetch(`/api/admin/backlinks/${id}`, { method: "DELETE" });
  },

  verifyBacklink(id: number): Promise<AdminBacklinkRow> {
    return adminFetch(`/api/admin/backlinks/${id}/verify`, { method: "POST", body: "{}" });
  },

  getCreditTransactions(q: AdminCreditTransactionsQuery = {}): Promise<AdminCreditTransactionsResponse> {
    return adminFetch(`/api/admin/credit-transactions${toQueryString(q)}`);
  },

  exportCreditTransactions(q: AdminCreditTransactionsQuery = {}): Promise<void> {
    const qs = toQueryString(q).replace(/^\?/, "");
    return adminDownload(qs ? `/api/admin/credit-transactions/export?${qs}` : "/api/admin/credit-transactions/export");
  },

  getApiLogs(q: AdminApiLogsQuery = {}): Promise<AdminApiLogsResponse> {
    return adminFetch(`/api/admin/api-logs${toQueryString(q)}`);
  },

  exportApiLogs(q: AdminApiLogsQuery = {}): Promise<void> {
    const qs = toQueryString(q).replace(/^\?/, "");
    return adminDownload(qs ? `/api/admin/api-logs/export?${qs}` : "/api/admin/api-logs/export");
  },

  getClusters(q: AdminClustersQuery = {}): Promise<AdminClustersListResponse> {
    return adminFetch(`/api/admin/clusters${toQueryString(q)}`);
  },

  getClusterSnapshots(clusterId: number): Promise<AdminClusterSnapshotsResponse> {
    return adminFetch(`/api/admin/clusters/${clusterId}/snapshots`);
  },

  getSubscriptions(q: AdminSubscriptionsQuery = {}): Promise<AdminSubscriptionsListResponse> {
    return adminFetch(`/api/admin/subscriptions${toQueryString(q)}`);
  },

  getSubscription(id: number): Promise<AdminSubscriptionRow> {
    return adminFetch(`/api/admin/subscriptions/${id}`);
  },

  clearCache(): Promise<AdminCacheClearResponse> {
    return adminFetch("/api/admin/cache/clear", { method: "POST", body: "{}" });
  },

  getSystemHealth(): Promise<AdminSystemHealth> {
    return adminFetch("/api/admin/system/health");
  },

  createAnnouncement(body: { title: string; body: string }): Promise<AdminAnnouncement> {
    return adminFetch<AdminAnnouncement>("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getFeatures(): Promise<AdminFeaturesListResponse> {
    return adminFetch("/api/admin/features");
  },

  createFeature(body: AdminFeatureCreateBody): Promise<AdminBillableFeatureRow> {
    return adminFetch<AdminBillableFeatureRow>("/api/admin/features", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateFeature(id: number, body: AdminFeaturePatchBody): Promise<AdminBillableFeatureRow> {
    return adminFetch<AdminBillableFeatureRow>(`/api/admin/features/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};
