import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth";
import { setAccessToken, setCsrfToken, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = useCallback(() => {
    setAccessToken(null);
    setCsrfToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(forceLogout);
  }, [forceLogout]);

  // On first load, try to silently resume a session using the httpOnly
  // refresh cookie (if the browser still has one from a previous visit).
  // The CSRF token is bootstrapped first: it only ever lives in memory on
  // the frontend, so a full page reload always starts with none at all —
  // without this, the refresh call below would go out with no CSRF header
  // and get rejected even for a returning user with a perfectly valid
  // session.
  //
  // The `cancelled` guard matters here specifically because React 18
  // StrictMode double-invokes effects in development: two overlapping runs
  // of this effect each rotate the refresh token, so one of them always
  // loses that race and fails. Without this guard, if the losing (faster,
  // since a CSRF rejection is a cheap synchronous check) call finished
  // first, its `finally` would flip loading to false while `user` was still
  // null, and ProtectedRoute would redirect to /login in that gap — before
  // the winning call had a chance to actually set the user a moment later.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { csrfToken: bootstrapped } = await authApi.csrf();
        if (cancelled) return;
        setCsrfToken(bootstrapped);
        const data = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setCsrfToken(data.csrfToken);
        setUser(data.user);
      } catch {
        // no valid session — that's fine, user just isn't logged in
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const registerRequestOtp = useCallback(async (draft) => {
    return authApi.registerRequestOtp(draft);
  }, []);

  const registerVerifyOtp = useCallback(async (draft, code) => {
    const data = await authApi.registerVerifyOtp({ ...draft, code });
    setAccessToken(data.accessToken);
    setCsrfToken(data.csrfToken);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (phone, password) => {
    const data = await authApi.login({ phone, password });
    setAccessToken(data.accessToken);
    setCsrfToken(data.csrfToken);
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
