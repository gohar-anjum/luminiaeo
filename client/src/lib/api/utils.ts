import { apiClient, ApiError } from "./client";
import type {
  KeywordResearchStatus,
  CitationStatusResponse,
  BacklinkStatusResponse,
} from "./types";

export interface PollOptions {
  maxAttempts?: number;
  interval?: number;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Polls a task status endpoint until completion or failure
 */
export async function pollTaskStatus<T extends { status: string }>(
  statusFn: () => Promise<T>,
  options: PollOptions = {}
): Promise<T> {
  const {
    maxAttempts = 60,
    interval = 2000,
    onProgress,
    onStatusChange,
  } = options;

  let attempts = 0;
  let lastStatus: string | null = null;

  while (attempts < maxAttempts) {
    try {
      const status = await statusFn();

      // Notify status change
      if (onStatusChange && status.status !== lastStatus) {
        onStatusChange(status.status);
        lastStatus = status.status;
      }

      // Check if completed
      if (status.status === "completed") {
        return status;
      }

      // Check if failed
      if (status.status === "failed") {
        throw new Error("Task failed");
      }

      // Calculate progress if available
      if ("progress" in status && status.progress) {
        const progress = status.progress as any;
        if (progress.percentage !== undefined && onProgress) {
          onProgress(progress.percentage);
        } else if (
          progress.processed !== undefined &&
          progress.total !== undefined &&
          onProgress
        ) {
          onProgress((progress.processed / progress.total) * 100);
        }
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      // Handle rate limiting
      if (error instanceof ApiError && error.status === 429) {
        // Exponential backoff for rate limits
        const backoffDelay = Math.min(interval * Math.pow(2, attempts), 30000);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }

      // Re-throw other errors
      throw error;
    }
  }

  throw new Error("Task polling timeout");
}

/**
 * Polls keyword research status
 */
export async function pollKeywordResearchStatus(
  jobId: number,
  options: PollOptions = {}
): Promise<KeywordResearchStatus> {
  return pollTaskStatus(
    () => apiClient.getKeywordResearchStatus(jobId),
    options
  );
}

/**
 * Polls citation analysis status
 */
export async function pollCitationStatus(
  taskId: number,
  options: PollOptions = {}
): Promise<CitationStatusResponse> {
  return pollTaskStatus(
    () => apiClient.getCitationStatus(taskId),
    options
  );
}

/**
 * Polls backlink analysis status
 */
export async function pollBacklinkStatus(
  taskId: string,
  options: PollOptions = {}
): Promise<BacklinkStatusResponse> {
  return pollTaskStatus(
    () => apiClient.getBacklinkStatus({ task_id: taskId }),
    options
  );
}

/**
 * Handles API errors with appropriate user feedback
 */
export function handleApiError(error: unknown): {
  message: string;
  shouldRedirect?: boolean;
  redirectTo?: string;
} {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return {
          message: "Your session has expired. Please log in again.",
          shouldRedirect: true,
          redirectTo: "/login",
        };
      case 422:
        return {
          message: error.message || "Validation error. Please check your input.",
        };
      case 429:
        return {
          message: "Rate limit exceeded. Please try again in a moment.",
        };
      case 404:
        return {
          message: "Resource not found.",
        };
      case 500:
        return {
          message: "Server error. Please try again later.",
        };
      case 502:
        return {
          message: "External service error. Please try again later.",
        };
      default:
        return {
          message: error.message || "An error occurred. Please try again.",
        };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred.",
    };
  }

  return {
    message: "An unknown error occurred. Please try again.",
  };
}

/**
 * Retries an API call with exponential backoff
 */
export async function requestWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry on 401, 404, or 422 errors
      if (error instanceof ApiError) {
        if ([401, 404, 422].includes(error.status)) {
          throw error;
        }

        // For rate limits, use longer backoff
        if (error.status === 429) {
          const delay = baseDelay * Math.pow(2, attempt) * 2; // Extra delay for rate limits
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Exponential backoff for other errors
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes URL (adds https:// if missing)
 */
export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}


