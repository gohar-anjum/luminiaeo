// API Response Types based on LuminiaEO Backend API Integration Guide

export interface ApiResponse<T> {
  status: number;
  message: string;
  response: T | null;
}

export interface ApiError {
  status: number;
  message: string;
  response: null;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginResponse {
  auth_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Keyword Research Types
export interface KeywordResearchRequest {
  query: string;
  project_id?: number | null;
  language_code?: string;
  geo_target_id?: number;
  max_keywords?: number;
  enable_google_planner?: boolean;
  enable_scraper?: boolean;
  enable_answerthepublic?: boolean;
  enable_clustering?: boolean;
  enable_intent_scoring?: boolean;
  use_dataforseo_planner?: boolean; // Prefer DataForSEO over Google Keyword Planner
}

export interface KeywordResearchJob {
  id: number;
  query: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at?: string;
}

export interface KeywordResearchStatus {
  id: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  created_at: string;
}

export interface KeywordData {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
  intent?: string;
  cluster_id?: number;
  source: string; // Can be 'google_keyword_planner', 'dataforseo_keyword_planner', 'scraper', 'answerthepublic', etc.
}

export interface Cluster {
  id: number;
  topic_name: string;
  keyword_count: number;
  suggested_article_titles?: string[];
  recommended_faq_questions?: string[];
}

export interface KeywordResearchResults {
  id: number;
  query: string;
  status: string;
  keywords: KeywordData[];
  clusters: Cluster[];
  created_at: string;
}

// Keyword Planner Types
export interface KeywordIdea {
  keyword: string;
  search_volume: number;
  competition: number;
}

export interface KeywordPlannerForSiteRequest {
  target: string;
  location_code?: number;
  language_code?: string;
  search_partners?: boolean;
  limit?: number;
}

export interface KeywordPlannerForSiteResponse {
  keyword: string;
  location_code: number;
  language_code: string;
  competition: number;
  search_volume: number;
  cpc: number;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface CombinedKeywordsRequest {
  target: string;
  location_code?: number;
  language_code?: string;
  limit?: number;
  num_clusters?: number;
  enable_clustering?: boolean;
}

export interface CombinedKeywordsResponse {
  keywords: KeywordData[];
  total_count: number;
  clusters: Cluster[];
  keyword_cluster_map: Record<string, number>;
  clusters_count: number;
}

// SEO Data Types
export interface SearchVolumeRequest {
  keywords: string[];
  language_code?: string;
  location_code?: number;
}

export interface SearchVolumeResponse {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
  competition_index: number;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface KeywordsForSiteRequest {
  target: string;
  location_code?: number;
  language_code?: string;
  search_partners?: boolean;
  date_from?: string;
  date_to?: string;
  include_serp_info?: boolean;
  tag?: string;
  limit?: number;
}

export interface KeywordsForSiteResponse {
  keyword: string;
  location_code: number;
  language_code: string;
  competition: number;
  search_volume: number;
  cpc: number;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

// Backlinks Types
export interface BacklinkSubmitRequest {
  domain: string;
  limit?: number;
}

export interface Backlink {
  source_url: string;
  domain_from: string;
  anchor: string;
  link_type: "dofollow" | "nofollow";
  domain_rank: number;
  ip: string;
  whois_registrar: string;
  domain_age_days: number;
  pbn_probability: number;
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface BacklinkSummary {
  total_backlinks: number;
  dofollow_count: number;
  nofollow_count: number;
}

export interface PBNDetection {
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface BacklinkSubmitResponse {
  task_id: string;
  domain: string;
  status: string;
  submitted_at: string;
  completed_at?: string;
  backlinks: Backlink[];
  summary: BacklinkSummary;
  pbn_detection: PBNDetection;
}

export interface BacklinkStatusRequest {
  task_id: string;
}

export interface BacklinkStatusResponse {
  task_id: string;
  domain: string;
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  submitted_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

export interface BacklinkResultsRequest {
  task_id: string;
}

export interface BacklinkResultsResponse {
  task_id: string;
  status: string;
  results: {
    backlinks: Backlink[];
    summary: BacklinkSummary;
    pbn_detection: PBNDetection;
  };
  completed_at: string;
}

export interface HarmfulBacklinksRequest {
  domain: string;
  risk_levels?: ("low" | "medium" | "high" | "critical")[];
}

export interface HarmfulBacklinksResponse {
  domain: string;
  risk_levels: string[];
  count: number;
  backlinks: Array<{
    source_url: string;
    pbn_probability: number;
    risk_level: string;
    reasons: string[];
  }>;
}

// SERP Types
export interface SERPKeywordsRequest {
  keywords: string[];
  language_code?: string;
  location_code?: number;
  options?: Record<string, any>;
}

export interface SERPKeywordData {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
  difficulty: number;
  serp_features: string[];
}

export interface SERPResultsRequest {
  keywords: [string]; // Exactly one keyword
  language_code?: string;
  location_code?: number;
  options?: Record<string, any>;
}

export interface OrganicResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
}

export interface SERPResultsResponse {
  keyword: string;
  organic_results: OrganicResult[];
  people_also_ask: string[];
  related_searches: string[];
}

// FAQ Types
export interface FAQGenerateRequest {
  input: string;
  options?: {
    temperature?: number;
  };
}

export interface FAQ {
  question: string;
  answer: string;
  source?: string;
}

// Task-based FAQ API Types
export interface FAQTaskRequest {
  input: string;
  options?: {
    temperature?: number;
  };
}

export interface FAQTaskResponse {
  success: boolean;
  message: string;
  data: {
    task_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    created_at: string;
    updated_at?: string;
    completed_at?: string;
    faqs?: FAQ[];
    faqs_count?: number;
    error_message?: string;
    serp_questions_count?: number;
    alsoasked_search_id?: string;
  };
}

export interface FAQGenerateResponse {
  count: number;
  faqs: FAQ[];
  from_database: boolean;
  api_calls_saved: number;
  generated_at: string;
}

// Citation Types
export interface CitationAnalyzeRequest {
  url: string;
  num_queries?: number;
}

export interface CitationAnalyzeResponse {
  task_id: number;
  status: string;
  status_url: string;
  results_url: string;
}

export interface CitationStatusResponse {
  task_id: number;
  status: "queued" | "processing" | "completed" | "failed";
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  competitors: any[];
  meta: Record<string, any>;
}

export interface CitationResult {
  task_id: number;
  url: string;
  status: string;
  queries: string[];
  results: {
    by_query: Array<{
      query: string;
      gpt: {
        provider?: string; // Can be 'gpt', 'gemini', or 'dataforseo'
        citation_found: boolean;
        confidence: number;
        citation_references: Array<{
          url: string;
          relevance?: number;
        }> | string[]; // Can be array of objects or array of strings (DataForSEO)
        competitors?: any[];
        explanation?: string;
      };
      gemini: {
        citation_found: boolean;
        confidence: number;
        citation_references: any[];
      };
      top_competitors: any[];
    }>;
    scores: {
      gpt_score: number;
      gemini_score: number;
      dataforseo_score?: number;
    };
  };
  competitors: any[];
  meta: {
    gpt_score?: number;
    gemini_score?: number;
    dataforseo_score?: number;
    [key: string]: any;
  };
}

export interface CitationRetryResponse {
  task_id: number;
  missing_count: number;
}


