export interface StatCard {
  label: string;
  value: string | number;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral';
  color?: string;
  icon?: string;
}

export interface NavItem {
  label: string;
  section: string;
  icon: string;
  badge?: string | number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type BadgeColor =
  | 'green' | 'amber' | 'red' | 'blue'
  | 'purple' | 'teal' | 'gray' | 'pink';

export interface MetricRowData {
  name: string;
  value: string | number | React.ReactNode;
  pct?: number;
  color?: string;
}

export interface User {
  name: string;
  initials: string;
  email: string;
  credits: number;
  stripe?: string;
  trial: string;
  verified: boolean;
  joined: string;
  gradA: string;
  gradB: string;
}

export interface Transaction {
  user: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'adjustment';
  amount: string;
  balance: string;
  feature: string;
  status: string;
  date: string;
}

export interface FeatureCost {
  key: string;
  name: string;
  cost: number;
  active: boolean;
}

export interface PurchaseRules {
  minCredits: number;
  maxCredits: number;
  increment: number;
  centsPerCredit: number;
  signupBonus: number;
  currency: string;
}

export interface HealthCheck {
  name: string;
  status: string;
}

export interface QueueStat {
  label: string;
  value: string;
  badge?: BadgeColor;
}

export interface RateLimit {
  name: string;
  limit: string;
}

export interface ApiRequestLog {
  provider: string;
  feature: string;
  user: string;
  cache: 'hit' | 'miss';
  status: number;
  ms: string;
  error: string;
  time: string;
}

export interface KwJob {
  id: string;
  user: string;
  query: string;
  lang: string;
  geo: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  keywords?: number;
  pct: number;
  date: string;
}

export interface CitationTask {
  id: string;
  user: string;
  url: string;
  queries: number;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  gpt: string;
  gem: string;
  date: string;
}

export interface ClusterJob {
  id: string;
  keyword: string;
  user: string;
  lang: string;
  loc: string;
  status: 'completed' | 'failed' | 'pending' | 'processing';
  snapshot: string;
  date: string;
}

export interface Snapshot {
  name: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface SeoTask {
  taskId: string;
  type: 'backlinks' | 'search_volume' | 'keywords';
  domain: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  retries: number;
  submitted: string;
}

export interface RiskBreakdown {
  name: string;
  value: string;
  pct: number;
  color: string;
}

export interface PbnDetection {
  domain: string;
  count: string;
  badge: 'green' | 'amber' | 'red';
}

export interface FaqTask {
  taskId: string;
  user: string;
  input: string;
  questions?: number;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  cache: 'hit' | 'miss' | '—';
  date: string;
}

export interface ActivityFeedItem {
  msg: string;
  time: string;
  color: string;
}

export interface FailedJob {
  type: string;
  query: string;
  error: string;
  badge: BadgeColor;
}

export interface CacheHitByFeature {
  name: string;
  pct: number;
  color: string;
}

export interface ApiQuery {
  provider: string;
  feature: string;
  hash: string;
  created: string;
}

export interface MetaAnalysis {
  url: string;
  keyword: string;
  words: number;
  intent: string;
  date: string;
}

export interface SemanticAnalysis {
  url: string;
  keyword: string;
  score: string;
  type: string;
}

export interface ContentOutline {
  keyword: string;
  tone: string;
  intent: string;
  date: string;
}

export interface StripeEvent {
  type: string;
  time: string;
}

export type AdminPage =
  | 'dashboard'
  | 'users'
  | 'billing'
  | 'keyword-research'
  | 'keyword-clusters'
  | 'citations'
  | 'page-analysis'
  | 'seo-backlinks'
  | 'faq'
  | 'pbn-detections'
  | 'system-health'
  | 'api-cache'
  | 'features';

/** Valid URL segments for `/admin/:page` */
export const ADMIN_PAGE_IDS: readonly AdminPage[] = [
  'dashboard',
  'users',
  'billing',
  'keyword-research',
  'keyword-clusters',
  'citations',
  'page-analysis',
  'seo-backlinks',
  'faq',
  'pbn-detections',
  'system-health',
  'api-cache',
  'features',
] as const;

export function parseAdminPageParam(segment: string | undefined): AdminPage {
  if (segment && (ADMIN_PAGE_IDS as readonly string[]).includes(segment)) {
    return segment as AdminPage;
  }
  return 'dashboard';
}
