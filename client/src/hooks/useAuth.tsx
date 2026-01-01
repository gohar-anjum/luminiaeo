import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/apiConfig";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("auth_token");
      const stored = localStorage.getItem("auth");
      
      if (stored && authToken) {
        const authData = JSON.parse(stored);
        setIsAuthenticated(true);
        setUser(authData.user);
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
            
            setUser({ 
              name: userData.name || userData.email?.split("@")[0] || "", 
              email: userData.email || "" 
            });
            localStorage.setItem("auth", JSON.stringify({ 
              user: { 
                name: userData.name || userData.email?.split("@")[0] || "", 
                email: userData.email || "" 
              } 
            }));
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
            
            setIsAuthenticated(true);
            setUser({ 
              name: userData.name || userData.email?.split("@")[0] || "", 
              email: userData.email || "" 
            });
            localStorage.setItem("auth", JSON.stringify({ 
              user: { 
                name: userData.name || userData.email?.split("@")[0] || "", 
                email: userData.email || "" 
              } 
            }));
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

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", getApiUrl("/api/login"), { email, password });
    const response = await res.json();
    
    if (response.response && response.response.user) {
      const { auth_token, user: userData } = response.response;
      
      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }
      
      setIsAuthenticated(true);
      const user = { 
        name: userData.name || email.split("@")[0], 
        email: userData.email || email 
      };
      setUser(user);
      localStorage.setItem("auth", JSON.stringify({ user, auth_token }));
    } else {
      const userData = response.user || response;
      setIsAuthenticated(true);
      const user = { 
        name: userData.name || email.split("@")[0], 
        email: userData.email || email 
      };
      setUser(user);
      localStorage.setItem("auth", JSON.stringify({ user }));
    }
  };

  const signup = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const res = await apiRequest("POST", getApiUrl("/api/register"), { 
      name, 
      email, 
      password, 
      password_confirmation: passwordConfirmation 
    });
    const response = await res.json();
    
    if (response.status === 200 || response.message) {
      return;
    }
    
    if (response.response && response.response.user && response.response.auth_token) {
      const { auth_token, user: userData } = response.response;
      
      if (auth_token) {
        localStorage.setItem("auth_token", auth_token);
      }
      
      setIsAuthenticated(true);
      const user = { 
        name: userData.name || name, 
        email: userData.email || email 
      };
      setUser(user);
      localStorage.setItem("auth", JSON.stringify({ user, auth_token }));
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
        
        const updatedUser = { 
          name: userData.name || userData.email?.split("@")[0] || "", 
          email: userData.email || "" 
        };
        
        setUser(updatedUser);
        localStorage.setItem("auth", JSON.stringify({ 
          user: updatedUser 
        }));
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
