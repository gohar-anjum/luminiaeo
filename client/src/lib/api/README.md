# LuminiaEO API Client

This directory contains a comprehensive API client for integrating with the LuminiaEO Backend API, following the [Frontend Integration Guide](../README.md).

## Quick Start

```typescript
import { apiClient, ApiError, handleApiError } from "@/lib/api";

// Login
try {
  const response = await apiClient.login({
    email: "user@example.com",
    password: "password123",
  });
  console.log("Logged in:", response.user);
} catch (error) {
  const { message } = handleApiError(error);
  console.error(message);
}

// Get current user
const user = await apiClient.getCurrentUser();
```

## Features

- ✅ Type-safe API calls with TypeScript
- ✅ Automatic token management
- ✅ Error handling with proper status codes
- ✅ Rate limiting support with exponential backoff
- ✅ Polling utilities for async tasks
- ✅ Standardized response format handling

## Usage Examples

### Authentication

```typescript
import { apiClient } from "@/lib/api";

// Register new user
await apiClient.register({
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  password_confirmation: "password123",
});

// Login
const loginResponse = await apiClient.login({
  email: "john@example.com",
  password: "password123",
});
// Token is automatically stored in localStorage

// Get current user
const user = await apiClient.getCurrentUser();

// Logout
apiClient.logout();
```

### Keyword Research

```typescript
import { apiClient, pollKeywordResearchStatus } from "@/lib/api";

// Create keyword research job
const job = await apiClient.createKeywordResearch({
  query: "digital marketing",
  language_code: "en",
  geo_target_id: 2840,
  max_keywords: 1000,
});

// Poll for completion
const status = await pollKeywordResearchStatus(job.id, {
  maxAttempts: 60,
  interval: 2000,
  onProgress: (progress) => {
    console.log(`Progress: ${progress}%`);
  },
});

// Get results
const results = await apiClient.getKeywordResearchResults(job.id);
console.log(results.keywords);
```

### Citation Analysis

```typescript
import { apiClient, pollCitationStatus } from "@/lib/api";

// Start citation analysis
const task = await apiClient.analyzeCitations({
  url: "https://example.com/article",
  num_queries: 100,
});

// Poll for completion
const status = await pollCitationStatus(task.task_id, {
  onStatusChange: (status) => {
    console.log(`Status: ${status}`);
  },
});

// Get results
const results = await apiClient.getCitationResults(task.task_id);
console.log(results.results.scores);
```

### Backlinks Analysis

```typescript
import { apiClient, pollBacklinkStatus } from "@/lib/api";

// Submit backlink analysis
const response = await apiClient.submitBacklinkAnalysis({
  domain: "https://example.com",
  limit: 100,
});

// If status is not completed, poll for results
if (response.status !== "completed") {
  const status = await pollBacklinkStatus(response.task_id);
  
  if (status.status === "completed") {
    const results = await apiClient.getBacklinkResults({
      task_id: response.task_id,
    });
    console.log(results.results.backlinks);
  }
}
```

### FAQ Generation

```typescript
import { apiClient } from "@/lib/api";

const faqs = await apiClient.generateFAQs({
  input: "https://example.com",
  options: {
    temperature: 0.7,
  },
});

console.log(faqs.faqs);
```

### Error Handling

```typescript
import { apiClient, handleApiError, ApiError } from "@/lib/api";

try {
  await apiClient.getCurrentUser();
} catch (error) {
  const { message, shouldRedirect, redirectTo } = handleApiError(error);
  
  if (shouldRedirect && redirectTo) {
    window.location.href = redirectTo;
  } else {
    // Show error message to user
    console.error(message);
  }
}
```

### Rate Limiting

The API client automatically handles rate limiting with exponential backoff. For manual retry logic:

```typescript
import { requestWithRetry } from "@/lib/api/utils";

const result = await requestWithRetry(
  () => apiClient.getKeywordIdeas("seo tools"),
  maxRetries: 3,
  baseDelay: 1000
);
```

## API Client Methods

### Authentication
- `login(credentials: LoginRequest): Promise<LoginResponse>`
- `register(userData: RegisterRequest): Promise<void>`
- `getCurrentUser(): Promise<User>`
- `logout(): void`

### Keyword Research
- `createKeywordResearch(request: KeywordResearchRequest): Promise<KeywordResearchJob>`
- `listKeywordResearch(): Promise<KeywordResearchJob[]>`
- `getKeywordResearchStatus(id: number): Promise<KeywordResearchStatus>`
- `getKeywordResearchResults(id: number): Promise<KeywordResearchResults>`

### Keyword Planner
- `getKeywordIdeas(keyword: string): Promise<KeywordIdea[]>`
- `getKeywordsForSite(request: KeywordPlannerForSiteRequest): Promise<KeywordPlannerForSiteResponse[]>`
- `getCombinedKeywordsWithClusters(request: CombinedKeywordsRequest): Promise<CombinedKeywordsResponse>`

### SEO Data
- `getSearchVolume(request: SearchVolumeRequest): Promise<SearchVolumeResponse[]>`
- `getKeywordsForSiteDataForSEO(request: KeywordsForSiteRequest): Promise<KeywordsForSiteResponse[]>`

### Backlinks
- `submitBacklinkAnalysis(request: BacklinkSubmitRequest): Promise<BacklinkSubmitResponse>`
- `getBacklinkStatus(request: BacklinkStatusRequest): Promise<BacklinkStatusResponse>`
- `getBacklinkResults(request: BacklinkResultsRequest): Promise<BacklinkResultsResponse>`
- `getHarmfulBacklinks(request: HarmfulBacklinksRequest): Promise<HarmfulBacklinksResponse>`

### SERP
- `getSERPKeywordData(request: SERPKeywordsRequest): Promise<SERPKeywordData[]>`
- `getSERPResults(request: SERPResultsRequest): Promise<SERPResultsResponse>`

### FAQ
- `generateFAQs(request: FAQGenerateRequest): Promise<FAQGenerateResponse>`

### Citations
- `analyzeCitations(request: CitationAnalyzeRequest): Promise<CitationAnalyzeResponse>`
- `getCitationStatus(taskId: number): Promise<CitationStatusResponse>`
- `getCitationResults(taskId: number): Promise<CitationResult>`
- `retryCitationAnalysis(taskId: number): Promise<{ task_id: number; missing_count: number }>`

## Utility Functions

### Polling
- `pollTaskStatus<T>(statusFn, options): Promise<T>` - Generic polling function
- `pollKeywordResearchStatus(jobId, options): Promise<KeywordResearchStatus>`
- `pollCitationStatus(taskId, options): Promise<CitationStatusResponse>`
- `pollBacklinkStatus(taskId, options): Promise<BacklinkStatusResponse>`

### Error Handling
- `handleApiError(error): { message, shouldRedirect?, redirectTo? }` - User-friendly error handling

### Retry Logic
- `requestWithRetry<T>(apiCall, maxRetries, baseDelay): Promise<T>` - Retry with exponential backoff

### URL Utilities
- `validateUrl(url): boolean` - Validate URL format
- `normalizeUrl(url): string` - Add https:// if missing

## TypeScript Types

All types are exported from `@/lib/api/types`. Key types include:

- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Error class with status code
- Request/Response types for all endpoints
- Domain-specific types (User, KeywordData, Cluster, etc.)

## Configuration

The API client uses the base URL from environment variables:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Or in production:
```env
VITE_API_BASE_URL=https://your-domain.com
```

## Migration from Existing Code

If you're using the existing `apiRequest` function, you can gradually migrate:

```typescript
// Old way
const response = await apiRequest("POST", getApiUrl("/api/keyword-research"), data);
const result = await response.json();

// New way
const result = await apiClient.createKeywordResearch(data);
```

The new client provides:
- Better type safety
- Automatic error handling
- Standardized response parsing
- Built-in polling utilities


