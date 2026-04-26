import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl, USE_MOCK_API, shouldUseRealAPI } from "./apiConfig";
import { mockFetch } from "@/utils/mockFetch";
import { tryDispatchEmailUnverified } from "@/lib/api/emailUnverified";

/** Pick first string from Laravel-style `errors: { field: string[] }` payloads. */
function firstFieldError(errors: unknown): string | null {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return null;
  for (const v of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
  return null;
}

function messageFromErrorJsonBody(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const fromFields = firstFieldError((data as { errors?: unknown }).errors);
  if (fromFields) return fromFields;
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  return null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: any = null;

    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await res.json();
        const fromBody = messageFromErrorJsonBody(errorData);
        if (fromBody) {
          errorMessage = fromBody;
        }
        tryDispatchEmailUnverified(res.status, errorData);
      } else {
        const text = await res.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch {
      // If parsing fails, use status text
      errorMessage = res.statusText;
    }

    const error = new Error(errorMessage) as any;
    error.status = res.status;
    error.response = errorData;
    throw error;
  }
}

const mockDataMap = new Map<string, () => Promise<any>>();

export function registerMockData(endpoint: string, mockDataLoader: () => Promise<any>) {
  mockDataMap.set(endpoint, mockDataLoader);
}

async function getMockData<T>(endpoint: string): Promise<T | null> {
  const loader = mockDataMap.get(endpoint);
  if (loader) {
    const data = await loader();
    return mockFetch(data);
  }
  return null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const useRealAPI = shouldUseRealAPI(url);
  
  if (!useRealAPI && USE_MOCK_API) {
    throw new Error("Mock API: Use mock data directly for mutations");
  }
  
  const fullUrl = url.startsWith("http://") || url.startsWith("https://") 
    ? url 
    : getApiUrl(url);
  
  const authToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  const headers: HeadersInit = {
    "Accept": "application/json",
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle rate limiting (429) with better error message
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const message = retryAfter
      ? `Rate limit exceeded. Please retry after ${retryAfter} seconds.`
      : "Rate limit exceeded. Please try again later.";
    const error = new Error(message) as any;
    error.status = 429;
    throw error;
  }

  await throwIfResNotOk(res);

  // Some APIs return HTTP 200 with a JSON envelope like `{ status: 422, message, response }`
  if (res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      let data: any;
      try {
        data = await res.clone().json();
      } catch {
        return res;
      }
      if (
        data &&
        typeof data === "object" &&
        typeof data.status === "number" &&
        data.status >= 400
      ) {
        tryDispatchEmailUnverified(data.status, data);
        const msg = messageFromErrorJsonBody(data) || "Request failed";
        const error = new Error(msg) as any;
        error.status = data.status;
        error.response = data;
        throw error;
      }
    }
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }): Promise<T> => {
    const endpoint = queryKey.join("/") as string;
    
    const useRealAPI = shouldUseRealAPI(endpoint);
    
    if (useRealAPI || !USE_MOCK_API) {
      const fullUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://")
        ? endpoint
        : getApiUrl(endpoint);
      
      const authToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const headers: HeadersInit = {
        "Accept": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as T;
      }

      await throwIfResNotOk(res);
      
      const data = await res.json();
      
      // Handle standard API response format
      if (data.status !== undefined && data.response !== undefined) {
        // Standard API response format
        if (data.status >= 200 && data.status < 300) {
          return data.response as T;
        } else {
          tryDispatchEmailUnverified(data.status, data);
          throw new Error(data.message || "API request failed");
        }
      }
      
      // Direct response (no wrapper)
      return data as T;
    }
    
    const mockData = await getMockData<T>(endpoint);
    if (mockData !== null) {
      return mockData as T;
    }
    throw new Error(`No mock data registered for endpoint: ${endpoint}. Please register mock data using registerMockData().`);
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
