import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { api, setToken, clearToken, isAuthenticated, getPermissions, getUserInfo } from "@/lib/api";
import type { TokenResponseDto } from "@/lib/types";

interface AuthContextType {
  authenticated: boolean;
  permissions: string[];
  userEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [permissions, setPermissions] = useState<string[]>(getPermissions());
  const [userEmail, setUserEmail] = useState<string | null>(getUserInfo()?.email || null);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<TokenResponseDto>("/auth/login", { email, password });
    setToken(data.accessToken, data.expiresAt);
    setAuthenticated(true);
    setPermissions(getPermissions());
    setUserEmail(data.email || email);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
    setPermissions([]);
    setUserEmail(null);
  }, []);

  const hasPermission = useCallback((perm: string) => permissions.includes(perm), [permissions]);

  return (
    <AuthContext.Provider value={{ authenticated, permissions, userEmail, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
