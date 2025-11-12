import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const authData = JSON.parse(stored);
      setIsAuthenticated(true);
      setUser(authData.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const userData = { name: email.split("@")[0], email };
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("auth", JSON.stringify({ user: userData }));
  };

  const signup = async (name: string, email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const userData = { name, email };
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("auth", JSON.stringify({ user: userData }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout }}>
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
