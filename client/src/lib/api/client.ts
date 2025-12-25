import { getApiUrl } from "@/lib/apiConfig";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  KeywordResearchRequest,
  KeywordResearchJob,
  KeywordResearchStatus,
  KeywordResearchResults,
  KeywordIdea,
  KeywordPlannerForSiteRequest,
  KeywordPlannerForSiteResponse,
  CombinedKeywordsRequest,
  CombinedKeywordsResponse,
  SearchVolumeRequest,
  SearchVolumeResponse,
  KeywordsForSiteRequest,
  KeywordsForSiteResponse,
  BacklinkSubmitRequest,
  BacklinkSubmitResponse,
  BacklinkStatusRequest,
  BacklinkStatusResponse,
  BacklinkResultsRequest,
  BacklinkResultsResponse,
  HarmfulBacklinksRequest,
  HarmfulBacklinksResponse,
  SERPKeywordsRequest,
  SERPKeywordData,
  SERPResultsRequest,
  SERPResultsResponse,
  FAQGenerateRequest,
  FAQGenerateResponse,
  FAQTaskRequest,
  FAQTaskResponse,
  CitationAnalyzeRequest,
  CitationAnalyzeResponse,
  CitationStatusResponse,
  CitationResult,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: any = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || "";
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : getApiUrl(endpoint.startsWith("/") ? endpoint : `/${endpoint}`);

    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (data.status >= 200 && data.status < 300) {
        return data.response as T;
      } else {
        throw new ApiError(
          data.message || "An error occurred",
          data.status || response.status,
          data.response
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 0);
      }
      throw new ApiError("Network error", 0);
    }
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  private async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(getApiUrl("/api/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === 200 && data.response) {
      // Store token and user
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.response.auth_token);
        localStorage.setItem("user", JSON.stringify(data.response.user));
      }
      return data.response;
    }

    throw new ApiError(
      data.message || "Login failed",
      data.status || response.status
    );
  }

  async register(userData: RegisterRequest): Promise<void> {
    const response = await fetch(getApiUrl("/api/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status !== 200) {
      throw new ApiError(
        data.message || "Registration failed",
        data.status || response.status
      );
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>("/api/user");
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  }

  // Keyword Research Methods
  async createKeywordResearch(
    request: KeywordResearchRequest
  ): Promise<KeywordResearchJob> {
    const response = await fetch(getApiUrl("/api/keyword-research"), {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === "success" || data.status === 201) {
      return data.data || data.response;
    }

    throw new ApiError(
      data.message || "Failed to create keyword research job",
      data.status || response.status
    );
  }

  async listKeywordResearch(): Promise<KeywordResearchJob[]> {
    return this.get<KeywordResearchJob[]>("/api/keyword-research");
  }

  async getKeywordResearchStatus(
    id: number
  ): Promise<KeywordResearchStatus> {
    return this.get<KeywordResearchStatus>(
      `/api/keyword-research/${id}/status`
    );
  }

  async getKeywordResearchResults(
    id: number
  ): Promise<KeywordResearchResults> {
    return this.get<KeywordResearchResults>(
      `/api/keyword-research/${id}/results`
    );
  }

  // Keyword Planner Methods
  async getKeywordIdeas(keyword: string): Promise<KeywordIdea[]> {
    const response = await fetch(
      getApiUrl(`/api/keyword-planner/ideas?keyword=${encodeURIComponent(keyword)}`),
      {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (data.status === "success" && data.data) {
      return data.data;
    }

    throw new ApiError(
      data.message || "Failed to get keyword ideas",
      data.status || response.status
    );
  }

  async getKeywordsForSite(
    request: KeywordPlannerForSiteRequest
  ): Promise<KeywordPlannerForSiteResponse[]> {
    return this.post<KeywordPlannerForSiteResponse[]>(
      "/api/keyword-planner/for-site",
      request
    );
  }

  async getCombinedKeywordsWithClusters(
    request: CombinedKeywordsRequest
  ): Promise<CombinedKeywordsResponse> {
    return this.post<CombinedKeywordsResponse>(
      "/api/keyword-planner/combined-with-clusters",
      request
    );
  }

  // SEO Data Methods
  async getSearchVolume(
    request: SearchVolumeRequest
  ): Promise<SearchVolumeResponse[]> {
    return this.post<SearchVolumeResponse[]>(
      "/api/seo/keywords/search-volume",
      request
    );
  }

  async getKeywordsForSiteDataForSEO(
    request: KeywordsForSiteRequest
  ): Promise<KeywordsForSiteResponse[]> {
    return this.post<KeywordsForSiteResponse[]>(
      "/api/seo/keywords/for-site",
      request
    );
  }

  // Backlinks Methods
  async submitBacklinkAnalysis(
    request: BacklinkSubmitRequest
  ): Promise<BacklinkSubmitResponse> {
    return this.post<BacklinkSubmitResponse>(
      "/api/seo/backlinks/submit",
      request
    );
  }

  async getBacklinkStatus(
    request: BacklinkStatusRequest
  ): Promise<BacklinkStatusResponse> {
    return this.post<BacklinkStatusResponse>(
      "/api/seo/backlinks/status",
      request
    );
  }

  async getBacklinkResults(
    request: BacklinkResultsRequest
  ): Promise<BacklinkResultsResponse> {
    return this.post<BacklinkResultsResponse>(
      "/api/seo/backlinks/results",
      request
    );
  }

  async getHarmfulBacklinks(
    request: HarmfulBacklinksRequest
  ): Promise<HarmfulBacklinksResponse> {
    return this.post<HarmfulBacklinksResponse>(
      "/api/seo/backlinks/harmful",
      request
    );
  }

  // SERP Methods
  async getSERPKeywordData(
    request: SERPKeywordsRequest
  ): Promise<SERPKeywordData[]> {
    return this.post<SERPKeywordData[]>("/api/serp/keywords", request);
  }

  async getSERPResults(request: SERPResultsRequest): Promise<SERPResultsResponse> {
    return this.post<SERPResultsResponse>("/api/serp/results", request);
  }

  // FAQ Methods
  async generateFAQs(request: FAQGenerateRequest): Promise<FAQGenerateResponse> {
    return this.post<FAQGenerateResponse>("/api/faq/generate", request);
  }

  // Task-based FAQ Methods
  async createFaqTask(request: FAQTaskRequest): Promise<FAQTaskResponse> {
    const response = await fetch(getApiUrl("/api/faq/task"), {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });

    const data = await response.json();

    // If response is not OK, throw error
    if (!response.ok) {
      throw new ApiError(
        data.message || "Failed to create FAQ task",
        response.status,
        data
      );
    }

    // Handle different response formats
    // Format 1: { success: true, message: "...", data: {...} }
    if (data.success && data.data) {
      return data;
    }

    // Format 2: { status: 200, message: "...", response: {...} }
    if ((data.status === 200 || data.status === "success") && data.response) {
      // Check if response has the expected structure
      const responseData = data.response;
      if (responseData && (responseData.task_id || responseData.data?.task_id)) {
        return {
          success: true,
          message: data.message || "FAQ task created successfully",
          data: responseData.task_id ? responseData : responseData.data || responseData,
        };
      }
    }

    // If response is OK but format is unexpected, try to extract task_id from various possible locations
    // This provides more lenient handling for different API response formats
    let taskId: string | undefined;
    let taskData: any;

    if (data.data?.task_id) {
      taskId = data.data.task_id;
      taskData = data.data;
    } else if (data.task_id) {
      taskId = data.task_id;
      taskData = data;
    } else if (data.response?.task_id) {
      taskId = data.response.task_id;
      taskData = data.response;
    } else if (data.response?.data?.task_id) {
      taskId = data.response.data.task_id;
      taskData = data.response.data;
    }

    if (taskId && taskData) {
      return {
        success: true,
        message: data.message || "FAQ task created successfully",
        data: taskData,
      };
    }

    // If we get here, the response format is truly unexpected
    console.error("Unexpected FAQ task response format:", data);
    throw new ApiError(
      data.message || "Unexpected response format from FAQ task API",
      response.status,
      data
    );
  }

  async getFaqTaskStatus(taskId: string): Promise<FAQTaskResponse> {
    const response = await fetch(getApiUrl(`/api/faq/task/${taskId}`), {
      method: "GET",
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (response.status === 404) {
      throw new ApiError("Task not found", 404, data);
    }

    // If response is not OK, throw error
    if (!response.ok) {
      throw new ApiError(
        data.message || "Failed to get task status",
        response.status,
        data
      );
    }

    // Handle different response formats
    // Format 1: { success: true, message: "...", data: {...} }
    if (data.success && data.data) {
      return data;
    }

    // Format 2: { status: 200, message: "...", response: {...} }
    if ((data.status === 200 || data.status === "success") && data.response) {
      return {
        success: true,
        message: data.message || "Task status retrieved successfully",
        data: data.response,
      };
    }

    // Try to extract task data from various possible locations (more lenient handling)
    let taskData: any;

    if (data.data) {
      taskData = data.data;
    } else if (data.response) {
      taskData = data.response;
    } else if (data.task_id || data.status) {
      taskData = data;
    }

    if (taskData && (taskData.task_id || taskData.status)) {
      return {
        success: true,
        message: data.message || "Task status retrieved successfully",
        data: taskData,
      };
    }

    // If we get here, the response format is unexpected
    console.error("Unexpected FAQ task status response format:", data);
    throw new ApiError(
      data.message || "Unexpected response format from FAQ task status API",
      response.status,
      data
    );
  }

  // Citation Methods
  async analyzeCitations(
    request: CitationAnalyzeRequest
  ): Promise<CitationAnalyzeResponse> {
    const response = await fetch(getApiUrl("/api/citations/analyze"), {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === 202 && data.response) {
      return data.response;
    }

    throw new ApiError(
      data.message || "Failed to analyze citations",
      data.status || response.status
    );
  }

  async getCitationStatus(taskId: number): Promise<CitationStatusResponse> {
    return this.get<CitationStatusResponse>(`/api/citations/status/${taskId}`);
  }

  async getCitationResults(taskId: number): Promise<CitationResult> {
    return this.get<CitationResult>(`/api/citations/results/${taskId}`);
  }

  async retryCitationAnalysis(taskId: number): Promise<{ task_id: number; missing_count: number }> {
    const response = await fetch(getApiUrl(`/api/citations/retry/${taskId}`), {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === 200 && data.response) {
      return data.response;
    }

    throw new ApiError(
      data.message || "Failed to retry citation analysis",
      data.status || response.status
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

