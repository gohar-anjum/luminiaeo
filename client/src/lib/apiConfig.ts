// In dev, use empty base so requests go to same origin and Vite proxy avoids CORS
const rawBase = import.meta.env.VITE_API_BASE_URL || "";
export const API_BASE_URL =
  import.meta.env.DEV && rawBase.startsWith("http://127.0.0.1")
    ? ""
    : rawBase;

export const REAL_API_ENDPOINTS = [
  "/api/login",
  "/api/register",
  "/api/logout",
  "/api/user",
  "/api/billing",
  "/api/pbn",
  "/api/faq",
  "/api/keyword-research",
  "/api/keyword-planner",
  "/api/keyword-clusters",
  "/api/seo",
  "/api/serp",
  "/api/citations",
];

export function shouldUseRealAPI(endpoint: string): boolean {
  return REAL_API_ENDPOINTS.some(realEndpoint => endpoint.startsWith(realEndpoint));
}

export const USE_MOCK_API = !API_BASE_URL;

export function getApiUrl(endpoint: string): string {
  const baseUrl = API_BASE_URL.endsWith("/") 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  return baseUrl ? `${baseUrl}${path}` : path;
}

