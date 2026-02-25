import { getApiUrl } from "@/lib/apiConfig";

export type BillingApiError = {
  status: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
};

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse<T>(res: Response): Promise<{ status: number; message: string; response: T }> {
  const data = await res.json();
  return {
    status: data.status ?? res.status,
    message: data.message ?? res.statusText,
    response: data.response,
  };
}

export type BalanceResponse = { credits_balance: number };
export type PurchaseRulesResponse = {
  min_credits: number;
  max_credits: number;
  credit_increment: number;
  cents_per_credit: number;
};
export type BillingFeature = { id: string; key: string; name: string; credit_cost: number };
export type FeaturesResponse = { features: BillingFeature[] };
export type CheckoutResponse = { checkout_url: string; session_id: string };
export type ConfirmSessionResponse = {
  credits_balance: number;
  credits_added?: number;
  already_credited?: boolean;
};

/** POST /api/billing/confirm-session with { session_id }. Verifies payment with Stripe and adds credits if not already applied. Returns new balance. */
export async function confirmSession(sessionId: string): Promise<ConfirmSessionResponse> {
  const res = await fetch(getApiUrl("/api/billing/confirm-session"), {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ session_id: sessionId }),
  });
  const { status, message, response } = await parseJsonResponse<ConfirmSessionResponse>(res);
  if (status >= 200 && status < 300 && response) {
    return response;
  }
  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (response as any)?.errors;
  throw err;
}

/** GET /api/billing/balance */
export async function getBalance(): Promise<number> {
  const res = await fetch(getApiUrl("/api/billing/balance"), {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const { status, message, response } = await parseJsonResponse<BalanceResponse>(res);
  if (status >= 200 && status < 300 && response) {
    return response.credits_balance;
  }
  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (response as any)?.errors;
  throw err;
}

/** GET /api/billing/purchase-rules */
export async function getPurchaseRules(): Promise<PurchaseRulesResponse> {
  const res = await fetch(getApiUrl("/api/billing/purchase-rules"), {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const { status, message, response } = await parseJsonResponse<PurchaseRulesResponse>(res);
  if (status >= 200 && status < 300 && response) {
    return response;
  }
  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (response as any)?.errors;
  throw err;
}

/** GET /api/billing/features */
export async function getFeatures(): Promise<BillingFeature[]> {
  const res = await fetch(getApiUrl("/api/billing/features"), {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  const { status, message, response } = await parseJsonResponse<FeaturesResponse>(res);
  if (status >= 200 && status < 300 && response?.features) {
    return response.features;
  }
  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (response as any)?.errors;
  throw err;
}

/** POST /api/billing/checkout with { credits: number }. Returns checkout_url for redirect. */
export async function createCheckout(credits: number): Promise<CheckoutResponse> {
  const res = await fetch(getApiUrl("/api/billing/checkout"), {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ credits }),
  });
  const { status, message, response } = await parseJsonResponse<CheckoutResponse>(res);
  if (status >= 200 && status < 300 && response?.checkout_url) {
    return response;
  }
  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (response as any)?.errors;
  throw err;
}

/** Build list of valid credit options: [min, min+increment, ...] up to maxCredits (default 1000). */
export function buildCreditOptions(
  minCredits: number,
  creditIncrement: number,
  maxCredits: number = 1000
): number[] {
  const options: number[] = [];
  for (let c = minCredits; c <= maxCredits; c += creditIncrement) {
    options.push(c);
  }
  return options;
}

/** Price in USD from credits and cents_per_credit. */
export function creditsToUsd(credits: number, centsPerCredit: number): string {
  const cents = credits * centsPerCredit;
  return (cents / 100).toFixed(2);
}

// --- Credit Activity / Transactions (Dashboard Recents) ---

export type CreditTransactionType = "purchase" | "usage" | "refund" | "bonus" | "adjustment";
export type CreditTransactionStatus = "pending" | "completed" | "reversed";

export type CreditTransaction = {
  id: number;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  feature_key: string | null;
  status: CreditTransactionStatus;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type TransactionsPagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type TransactionsResponse = {
  transactions: CreditTransaction[];
  pagination: TransactionsPagination;
};

export type GetTransactionsParams = {
  per_page?: number;
  page?: number;
  type?: CreditTransactionType;
};

/** GET /api/billing/transactions — credit activity for Dashboard Recents. Uses same auth as other billing calls. */
export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<TransactionsResponse> {
  const search = new URLSearchParams();
  if (params.per_page != null) search.set("per_page", String(params.per_page));
  if (params.page != null) search.set("page", String(params.page));
  if (params.type) search.set("type", params.type);
  const query = search.toString();
  const url = getApiUrl("/api/billing/transactions") + (query ? `?${query}` : "");

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const raw = await res.json();
  const status = raw.status ?? res.status;
  const message = raw.message ?? res.statusText;

  // Backend may return data in data or response
  const payload = raw.data ?? raw.response;
  if (status >= 200 && status < 300 && payload?.transactions) {
    return {
      transactions: payload.transactions,
      pagination: payload.pagination ?? {
        current_page: 1,
        per_page: payload.transactions.length,
        total: payload.transactions.length,
        last_page: 1,
      },
    };
  }

  const err = new Error(message) as Error & BillingApiError;
  err.status = status;
  err.message = message;
  err.errors = (payload as any)?.errors;
  throw err;
}
