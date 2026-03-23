/**
 * Maps API endpoints / query keys to human-readable loading phase messages.
 * Used by GlobalPhaseLoader to show "Initiating…", "Collecting data…", etc.
 */
const ENDPOINT_PHASES: Record<string, string> = {
  "/api/dashboard": "Loading dashboard…",
  "/api/keywords": "Collecting keyword data…",
  "/api/clusters": "Loading clusters…",
  "/api/user": "Checking authentication…",
  "/api/faq/task": "Initiating FAQ generation…",
  "/api/faq/generate": "Generating FAQs…",
  "/api/keyword-research": "Initiating keyword research…",
  "/api/keyword-clusters": "Building keyword cluster…",
  "/api/keyword-planner/ideas": "Fetching keyword ideas…",
  "/api/keyword-planner/informational-ideas": "Fetching informational keyword ideas…",
  "/api/keyword-planner/for-site": "Loading keywords for site…",
  "/api/keyword-planner/combined-with-clusters": "Combining keywords and clusters…",
  "/api/seo/keywords/search-volume": "Fetching search volume…",
  "/api/seo/keywords/for-site": "Loading SEO keywords…",
  "/api/seo/backlinks/submit": "Submitting backlink analysis…",
  "/api/seo/backlinks/status": "Checking backlink status…",
  "/api/seo/backlinks/results": "Loading backlink results…",
  "/api/seo/backlinks/harmful": "Fetching harmful backlinks…",
  "/api/serp/keywords": "Loading SERP keyword data…",
  "/api/serp/results": "Loading SERP results…",
  "/api/citations/analyze": "Analyzing citations…",
  "/api/citations/status": "Checking citation status…",
  "/api/citations/results": "Loading citation results…",
  "/api/location-codes": "Loading locations…",
  "/api/location-codes/countries": "Loading countries…",
  "/api/billing/transactions": "Loading recent activity…",
};

/** Default phase when no mapping exists */
const DEFAULT_PHASE = "Loading…";

function normalizeKey(key: unknown[]): string {
  const first = key[0];
  if (typeof first === "string") return first;
  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  return "";
}

function matchPhase(endpoint: string): string {
  if (ENDPOINT_PHASES[endpoint]) return ENDPOINT_PHASES[endpoint];
  // Prefix match for dynamic routes (e.g. /api/keyword-research/123/status)
  const base = endpoint.split("/").slice(0, 4).join("/");
  if (ENDPOINT_PHASES[base]) return ENDPOINT_PHASES[base];
  if (endpoint.includes("keyword")) return "Collecting keyword data…";
  if (endpoint.includes("faq")) return "Generating FAQs…";
  if (endpoint.includes("citation")) return "Analyzing citations…";
  if (endpoint.includes("backlink")) return "Loading backlink data…";
  if (endpoint.includes("serp")) return "Loading SERP data…";
  if (endpoint.includes("dashboard")) return "Loading dashboard…";
  if (endpoint.includes("cluster")) return "Loading clusters…";
  if (endpoint.includes("user")) return "Checking authentication…";
  return DEFAULT_PHASE;
}

export function getPhaseForQueryKey(queryKey: unknown[]): string {
  const endpoint = normalizeKey(queryKey);
  if (!endpoint) return DEFAULT_PHASE;
  return matchPhase(endpoint);
}

export function getPhaseForMutationKey(mutationKey: unknown[]): string {
  const endpoint = normalizeKey(mutationKey);
  if (!endpoint) return "Processing…";
  return matchPhase(endpoint) || "Processing…";
}
