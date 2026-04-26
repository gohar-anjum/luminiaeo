import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/apiConfig";

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  is_admin: boolean;
  suspended_at?: string | null;
  credits_balance?: number;
};

function toAuthUser(raw: Record<string, unknown> | null | undefined, emailFallback?: string): AuthUser {
  if (!raw) {
    return { name: "", email: emailFallback ?? "", is_admin: false };
  }
  const email = (typeof raw.email === "string" ? raw.email : emailFallback) ?? "";
  const name = (typeof raw.name === "string" ? raw.name : "") || email.split("@")[0] || "";
  const is_admin = raw.is_admin === true || raw.is_admin === 1;
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    name,
    email,
    is_admin,
    suspended_at: raw.suspended_at != null ? String(raw.suspended_at) : null,
    credits_balance: typeof raw.credits_balance === "number" ? raw.credits_balance : undefined,
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("auth_token");
      const stored = localStorage.getItem("auth");
      
      if (stored && authToken) {
        const authData = JSON.parse(stored);
        setIsAuthenticated(true);
        setUser(toAuthUser(authData.user));
        setIsLoading(false);
        
        try {
          const headers: HeadersInit = {
            "Accept": "application/json",
            "Authorization": `Bearer ${authToken}`,
          };
          
          const res = await fetch(getApiUrl("/api/user"), {
            credentials: "include",
            headers,
          });
          
          if (res.ok) {
            const response = await res.json();
            const userData = response.response?.user || response.user || response;
            const next = toAuthUser(
              typeof userData === "object" && userData !== null
                ? (userData as Record<string, unknown>)
                : undefined,
            );
            setUser(next);
            localStorage.setItem("auth", JSON.stringify({ user: next }));
          } else if (res.status === 401) {
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem("auth");
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
        }
        return;
      }
      
      if (authToken) {
        try {
          const headers: HeadersInit = {
            "Accept": "application/json",
            "Authorization": `Bearer ${authToken}`,
          };
          
          const res = await fetch(getApiUrl("/api/user"), {
            credentials: "include",
            headers,
          });
          
          if (res.ok) {
            const response = await res.json();
            const userData = response.response?.user || response.user || response;
            const next = toAuthUser(
              typeof userData === "object" && userData !== null
                ? (userData as Record<string, unknown>)
                : undefined,
            );
            setIsAuthenticated(true);
            setUser(next);
            localStorage.setItem("auth", JSON.stringify({ user: next }));
          } else {
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem("auth");
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiRequest("POST", getApiUrl("/api/login"), { email, password });
    const response = await res.json();

    if (response.response && response.response.user) {
      const { auth_token, user: userData } = response.response;

      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }

      const next = toAuthUser(
        typeof userData === "object" && userData !== null
          ? (userData as Record<string, unknown>)
          : undefined,
        email,
      );
      setIsAuthenticated(true);
      setUser(next);
      localStorage.setItem("auth", JSON.stringify({ user: next, auth_token }));
      return next;
    }

    const userData = response.user || response;
    const next = toAuthUser(
      typeof userData === "object" && userData !== null
        ? (userData as Record<string, unknown>)
        : undefined,
      email,
    );
    setIsAuthenticated(true);
    setUser(next);
    localStorage.setItem("auth", JSON.stringify({ user: next }));
    return next;
  };

  const signup = async (name: string, email: string, password: string, passwordConfirmation: string) => {
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

    // Envelope errors (e.g. { status: 422, message, response: null } with HTTP 200) are thrown in apiRequest
    const st = response.status;
    if (st !== undefined && st !== 200 && st !== 201) {
      throw new Error(
        typeof response.message === "string" && response.message.trim()
          ? response.message
          : "Registration failed",
      );
    }

    if (response.response?.user && response.response?.auth_token) {
      const { auth_token, user: userData } = response.response;

      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }

      const next = toAuthUser(
        typeof userData === "object" && userData !== null
          ? (userData as Record<string, unknown>)
          : undefined,
        email,
      );
      setIsAuthenticated(true);
      setUser(next);
      localStorage.setItem("auth", JSON.stringify({ user: next, auth_token }));
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", getApiUrl("/api/logout"), {});
    } catch (error) {
    }
    
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("auth_token");
  };

  const refreshUser = async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      return;
    }

    try {
      const headers: HeadersInit = {
        "Accept": "application/json",
        "Authorization": `Bearer ${authToken}`,
      };
      
      const res = await fetch(getApiUrl("/api/user"), {
        credentials: "include",
        headers,
      });
      
      if (res.ok) {
        const response = await res.json();
        const userData = response.response?.user || response.user || response;
        const next = toAuthUser(
          typeof userData === "object" && userData !== null
            ? (userData as Record<string, unknown>)
            : undefined,
        );
        setUser(next);
        localStorage.setItem("auth", JSON.stringify({ user: next }));
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem("auth");
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout, refreshUser }}>
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
