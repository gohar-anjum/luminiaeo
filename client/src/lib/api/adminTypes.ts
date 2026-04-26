/** Types for Laravel admin routes — raw JSON (no status/message/response wrapper). */

export interface AdminPaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface AdminProductActivityBucket {
  faq_tasks: number;
  faqs_stored: number;
  citation_tasks: number;
  keyword_research_jobs: number;
  keyword_cluster_jobs: number;
  meta_analyses: number;
  semantic_analyses: number;
  content_outlines: number;
  pbn_detections: number;
}

export interface AdminDashboardStats {
  total_users: number;
  new_users_today: number;
  total_backlinks: number;
  new_backlinks_today: number;
  api_calls_today: number;
  api_cache_hit_rate: number;
  total_credits_sold: number;
  credits_used_today: number;
  active_subscriptions: number;
  product_activity?: {
    totals: AdminProductActivityBucket;
    today: AdminProductActivityBucket;
  };
  upstream_api_cache?: {
    calls_today: number;
    cache_hit_rate: number;
    description: string;
  };
}

export interface AdminDashboardCharts {
  users_by_date: Record<string, number>;
  backlinks_by_date: Record<string, number>;
  api_calls_by_date: Record<string, number>;
  credits_used_by_date: Record<string, number>;
  faq_tasks_by_date?: Record<string, number>;
  citation_tasks_by_date?: Record<string, number>;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  suspended_at: string | null;
  credits_balance: number;
  created_at: string;
  email_verified_at?: string | null;
}

/** POST /api/admin/users/{id}/adjust-credits — 200 */
export interface AdminCreditLedgerTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  user_id: number;
  created_at: string;
}

export interface AdminAdjustCreditsResponse {
  user: AdminUserRow;
  transaction: AdminCreditLedgerTransaction;
}

export type AdminProductActivityCounts = Partial<AdminProductActivityBucket> &
  Record<string, number | undefined>;

export type AdminUserDetail = AdminUserRow & {
  product_activity_counts?: AdminProductActivityCounts;
};

export interface AdminUsersListResponse {
  data: AdminUserRow[];
  meta: AdminPaginationMeta;
}

export interface AdminBacklinkRow {
  id: number;
  target_url: string;
  source_url: string;
  status: "pending" | "verified" | "failed";
  verified_at: string | null;
  user: { id: number; name: string } | null;
}

export interface AdminBacklinksListResponse {
  data: AdminBacklinkRow[];
  meta: AdminPaginationMeta;
}

export interface AdminCreditTransactionRow {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  reference_id: string;
  created_at: string;
}

export interface AdminCreditTransactionsResponse {
  data: AdminCreditTransactionRow[];
  meta: AdminPaginationMeta;
}

export interface AdminApiLogRow {
  id: number;
  user_id: number;
  log_kind?: string;
  endpoint: string;
  method: string;
  api_provider?: string;
  api_feature?: string;
  query_summary?: string | null;
  response_time_ms: number;
  status_code: number;
  cache_hit: boolean;
  created_at: string;
}

export interface AdminApiLogsContext {
  log_kind?: string;
  description?: string;
  catalog?: { method: string; path: string };
}

export interface AdminApiLogsResponse {
  data: AdminApiLogRow[];
  meta: AdminPaginationMeta;
  context?: AdminApiLogsContext;
}

export interface AdminClusterRow {
  id: number;
  cache_key: string;
  keyword: string;
  language_code: string;
  location_code: number;
  expires_at: string;
  status: "valid" | "expiring" | "expired";
}

export interface AdminClustersListResponse {
  data: AdminClusterRow[];
  meta: AdminPaginationMeta;
}

export interface AdminClusterSnapshotRow {
  id: number;
  cluster_id: number;
  expires_at: string;
  status: "valid" | "expiring" | "expired";
}

export interface AdminClusterSnapshotsResponse {
  data: AdminClusterSnapshotRow[];
}

export interface AdminSubscriptionRow {
  id: number;
  user_id: number;
  plan: string;
  status: string;
  current_period_end: string | null;
}

export interface AdminSubscriptionsListResponse {
  data: AdminSubscriptionRow[];
  meta: AdminPaginationMeta;
}

export interface AdminCacheClearResponse {
  ok: boolean;
}

export interface AdminSystemHealth {
  status: string;
  database: string;
  redis: string;
  timestamp: string;
}

export interface AdminAnnouncement {
  id: number;
  title: string;
  body: string;
  created_by: number | null;
  created_at: string;
}

/** Billable features — GET/POST/PATCH /admin/features (no delete). */
export interface AdminBillableFeatureRow {
  id: number;
  key: string;
  name: string;
  credit_cost: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminFeaturesListResponse {
  data: AdminBillableFeatureRow[];
}

export interface AdminFeatureCreateBody {
  key: string;
  name: string;
  credit_cost: number;
  is_active?: boolean;
}

export interface AdminFeaturePatchBody {
  name?: string;
  credit_cost?: number;
  is_active?: boolean;
}

export interface AdminUsersQuery {
  page?: number;
  per_page?: number;
  search?: string;
  suspended?: boolean;
}

export interface AdminBacklinksQuery {
  page?: number;
  per_page?: number;
  status?: "pending" | "verified" | "failed";
  domain?: string;
}

export interface AdminCreditTransactionsQuery {
  page?: number;
  per_page?: number;
  user_id?: number;
  type?: string;
}

export interface AdminApiLogsQuery {
  page?: number;
  per_page?: number;
  user_id?: number;
  endpoint?: string;
  method?: string;
}

export interface AdminClustersQuery {
  page?: number;
  per_page?: number;
}

export interface AdminSubscriptionsQuery {
  page?: number;
  per_page?: number;
}

/** Activity list query (faq-tasks, citations, keyword-research, cluster-jobs). */
export interface AdminActivityTaskQuery {
  page?: number;
  per_page?: number;
  user_id?: number;
  status?: string;
}

/** Meta / semantic / content-outline lists — no status filter. */
export interface AdminActivityAnalysisQuery {
  page?: number;
  per_page?: number;
  user_id?: number;
}

export interface AdminActivityPbnQuery {
  page?: number;
  per_page?: number;
  status?: string;
  domain?: string;
}

export interface AdminActivityCatalogListRef {
  method: string;
  path: string;
}

export interface AdminActivityCatalogFeature {
  id: string;
  label: string;
  description: string;
  list: AdminActivityCatalogListRef;
  counts: { total: number; created_today: number };
}

export interface AdminActivityCatalogOther {
  id: string;
  label: string;
  list: AdminActivityCatalogListRef;
}

export interface AdminActivityCatalogResponse {
  product_features: AdminActivityCatalogFeature[];
  other_admin_lists: AdminActivityCatalogOther[];
  upstream_integration_logs: {
    id: string;
    label: string;
    description: string;
    list: AdminActivityCatalogListRef;
  };
}

export interface AdminActivityFaqTaskRow {
  id: number;
  task_id: string;
  user_id: number;
  user_email: string;
  url: string;
  topic: string | null;
  search_keyword: string | null;
  status: string;
  faq_id: number | null;
  serp_question_count: number | null;
  paa_question_count: number | null;
  error_preview: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AdminActivityCitationTaskRow {
  id: number;
  user_id: number;
  user_email: string;
  url: string;
  status: string;
  queries_count: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminActivityKeywordResearchRow {
  id: number;
  user_id: number;
  user_email: string;
  query: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface AdminActivityMetaAnalysisRow {
  id: number;
  user_id: number;
  user_email: string;
  url: string;
  target_keyword: string;
  suggested_title: string;
  suggested_description: string;
  intent: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface AdminActivitySemanticAnalysisRow {
  id: number;
  user_id: number;
  user_email: string;
  source_url: string;
  target_keyword: string;
  semantic_score: number;
  analyzed_at: string | null;
  created_at: string;
}

export interface AdminActivityContentOutlineRow {
  id: number;
  user_id: number;
  user_email: string;
  keyword: string;
  tone: string | null;
  intent: string | null;
  outline_sections_count: number | null;
  generated_at: string | null;
  created_at: string;
}

export interface AdminActivityStoredFaqRow {
  id: number;
  user_id: number;
  user_email: string;
  url: string;
  topic: string | null;
  faq_items_count: number | null;
  api_calls_saved: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminActivityPbnRow {
  id: number;
  task_id: string;
  domain: string;
  status: string;
  high_risk_count: number | null;
  medium_risk_count: number | null;
  low_risk_count: number | null;
  analysis_started_at: string | null;
  analysis_completed_at: string | null;
  created_at: string;
}

export interface AdminActivityClusterJobRow {
  id: number;
  user_id: number;
  user_email: string;
  keyword: string;
  language_code: string;
  location_code: number;
  status: string;
  snapshot_id: number | null;
  error_preview: string | null;
  created_at: string;
  completed_at: string | null;
}

export type AdminActivityListResponse<T> = {
  data: T[];
  meta: AdminPaginationMeta;
};
