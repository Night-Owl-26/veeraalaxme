import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth";
import { setAccessToken, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(forceLogout);
  }, [forceLogout]);

  // On first load, try to silently resume a session using the httpOnly
  // refresh cookie (if the browser still has one from a previous visit).
  useEffect(() => {
    (async () => {
      try {
        const data = await authApi.refresh();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // no valid session — that's fine, user just isn't logged in
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const registerRequestOtp = useCallback(async (draft) => {
    return authApi.registerRequestOtp(draft);
  }, []);

  const registerVerifyOtp = useCallback(async (draft, code) => {
    const data = await authApi.registerVerifyOtp({ ...draft, code });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (phone, password) => {
    const data = await authApi.login({ phone, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      forceLogout();
    }
  }, [forceLogout]);

  const value = { user, setUser, loading, registerRequestOtp, registerVerifyOtp, login, logout, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
