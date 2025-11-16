import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl, USE_MOCK_API, shouldUseRealAPI } from "./apiConfig";
import { mockFetch } from "@/utils/mockFetch";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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

  await throwIfResNotOk(res);
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
      return await res.json();
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
