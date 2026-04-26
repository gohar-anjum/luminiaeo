import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/apiConfig";
import { normalizeUserResponse } from "@/lib/api/userResponse";
import { tryDispatchEmailUnverified } from "@/lib/api/emailUnverified";

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  is_admin: boolean;
  suspended_at?: string | null;
  credits_balance?: number;
  /** ISO string or null when email is not verified. */
  email_verified_at?: string | null;
};

function toAuthUser(raw: Record<string, unknown> | null | undefined, emailFallback?: string): AuthUser {
  if (!raw) {
    return { name: "", email: emailFallback ?? "", is_admin: false, email_verified_at: null };
  }
  const email = (typeof raw.email === "string" ? raw.email : emailFallback) ?? "";
  const name = (typeof raw.name === "string" ? raw.name : "") || email.split("@")[0] || "";
  const is_admin = raw.is_admin === true || raw.is_admin === 1;
  let email_verified_at: string | null = null;
  if (raw.email_verified_at != null) {
    email_verified_at =
      typeof raw.email_verified_at === "string" ? raw.email_verified_at : String(raw.email_verified_at);
  }
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    name,
    email,
    is_admin,
    suspended_at: raw.suspended_at != null ? String(raw.suspended_at) : null,
    credits_balance: typeof raw.credits_balance === "number" ? raw.credits_balance : undefined,
    email_verified_at,
  };
}

export function userNeedsEmailVerification(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.is_admin) return false;
  return user.email_verified_at == null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = useCallback((next: AuthUser, authToken?: string | null) => {
    setUser(next);
    setIsAuthenticated(true);
    if (authToken !== undefined && authToken !== null) {
      localStorage.setItem("auth", JSON.stringify({ user: next, auth_token: authToken }));
    } else {
      localStorage.setItem("auth", JSON.stringify({ user: next }));
    }
  }, []);

  const clearSession = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("auth_token");
  }, []);

  const fetchUserWithToken = useCallback(
    async (authToken: string) => {
      const headers: HeadersInit = {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      };
      const res = await fetch(getApiUrl("/api/user"), {
        credentials: "include",
        headers,
      });
      const body = (await readJsonSafe(res)) as unknown;
      if (res.ok) {
        const raw = normalizeUserResponse(body) as Record<string, unknown>;
        return toAuthUser(raw);
      }
      if (res.status === 401) {
        return null;
      }
      if (res.status === 403) {
        tryDispatchEmailUnverified(403, body);
      }
      return null;
    },
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("auth_token");
      const stored = localStorage.getItem("auth");

      if (stored && authToken) {
        const authData = JSON.parse(stored) as { user?: unknown };
        setIsAuthenticated(true);
        setUser(toAuthUser(authData.user as Record<string, unknown> | undefined));
        setIsLoading(false);

        try {
          const next = await fetchUserWithToken(authToken);
          if (next) {
            setUser(next);
            localStorage.setItem("auth", JSON.stringify({ user: next }));
          } else {
            clearSession();
          }
        } catch {
          /* keep optimistic user */
        }
        return;
      }

      if (authToken) {
        try {
          const next = await fetchUserWithToken(authToken);
          if (next) {
            setIsAuthenticated(true);
            setUser(next);
            localStorage.setItem("auth", JSON.stringify({ user: next }));
          } else {
            clearSession();
          }
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [clearSession, fetchUserWithToken]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiRequest("POST", getApiUrl("/api/login"), { email, password });
    const response = (await res.json()) as {
      status?: number;
      message?: string;
      response?: { auth_token?: string; user?: unknown };
    };

    if (response.response && response.response.user) {
      const { auth_token, user: userData } = response.response;
      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }
      const next = toAuthUser(
        typeof userData === "object" && userData !== null ? (userData as Record<string, unknown>) : undefined,
        email
      );
      applyUser(next, auth_token ?? null);
      return next;
    }

    const userData = (response as { user?: unknown }).user || response;
    const next = toAuthUser(
      typeof userData === "object" && userData !== null ? (userData as Record<string, unknown>) : undefined,
      email
    );
    applyUser(next, null);
    return next;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    const res = await apiRequest("POST", getApiUrl("/api/register"), {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const response = (await res.json()) as {
      status?: number;
      message?: string;
      response?: { user?: unknown; auth_token?: string } | null;
    };

    const st = response.status;
    if (st !== undefined && st !== 200 && st !== 201) {
      throw new Error(
        typeof response.message === "string" && response.message.trim()
          ? response.message
          : "Registration failed"
      );
    }

    if (response.response?.user && response.response?.auth_token) {
      const { auth_token, user: userData } = response.response;
      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }
      const next = toAuthUser(
        typeof userData === "object" && userData !== null ? (userData as Record<string, unknown>) : undefined,
        email
      );
      applyUser(next, auth_token);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<AuthUser> => {
    const res = await fetch(getApiUrl("/api/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
      credentials: "include",
    });
    const data = (await readJsonSafe(res)) as {
      status?: number;
      message?: string;
      response?: { auth_token?: string; user?: unknown };
    } | null;

    if (res.status === 409) {
      throw new Error((data as { message?: string })?.message || "This account must use a different sign-in method.");
    }
    if (res.status === 401) {
      throw new Error((data as { message?: string })?.message || "Google sign-in failed.");
    }
    if (!res.ok) {
      tryDispatchEmailUnverified(res.status, data);
      throw new Error((data as { message?: string })?.message || "Google sign-in failed.");
    }

    if (data && typeof data === "object" && data.status === 200 && data.response?.user && data.response?.auth_token) {
      const { auth_token, user: userData } = data.response;
      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }
      const next = toAuthUser(
        typeof userData === "object" && userData !== null ? (userData as Record<string, unknown>) : undefined
      );
      applyUser(next, auth_token);
      return next;
    }

    throw new Error("Unexpected response from Google sign-in.");
  };

  const resendVerificationEmail = async () => {
    await apiRequest("POST", getApiUrl("/api/email/verification-notification"), {});
  };

  const logout = async () => {
    try {
      await apiRequest("POST", getApiUrl("/api/logout"), {});
    } catch {
      /* still clear */
    }
    clearSession();
  };

  const refreshUser = async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      return;
    }
    const next = await fetchUserWithToken(authToken);
    if (next) {
      setUser(next);
      localStorage.setItem("auth", JSON.stringify({ user: next }));
    } else {
      const res = await fetch(getApiUrl("/api/user"), {
        credentials: "include",
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        clearSession();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        resendVerificationEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
