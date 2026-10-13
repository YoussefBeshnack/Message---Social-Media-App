import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthPayload, User } from "../types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  signInWith: (payload: AuthPayload) => void;
  signOut: () => void;
}

const TOKEN_KEY = "route-social-token";
const USER_KEY = "route-social-user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as User;
    } catch {
      return null;
    }
  });

  // Persist only after React state changes so refreshes can restore the session.
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  function signInWith(payload: AuthPayload) {
    if (payload.token) {
      localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
    }
    if (payload.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      setUser(payload.user);
    } else if (payload.userId) {
      const minimalUser = { userId: payload.userId };
      localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
      setUser(minimalUser);
    }
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, signInWith, signOut }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
