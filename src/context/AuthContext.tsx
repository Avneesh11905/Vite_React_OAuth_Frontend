import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { api, API_URL, setAccessToken, getCsrfToken } from "../lib/api";
import { getRouter } from "../router";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  receive_updates: boolean;
  login_methods: string[];
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      // Proactively refresh the session to verify the HttpOnly refresh token cookie.
      // We use raw axios to avoid triggering our interceptor's auto-retry logic.
      const headers: Record<string, string> = {};
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF"] = csrfToken;
      }

      const refreshResponse = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers }
      );

      if (!refreshResponse.data?.access_token) {
        throw new Error("No active session");
      }

      // Save the token in our closure for subsequent requests
      const newAccessToken = refreshResponse.data.access_token;
      setAccessToken(newAccessToken);

      // Now that we've verified the session, fetch the heavy user profile
      const response = await api.get("/users/me");
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // If refresh fails, they are fully logged out.
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run the session check when the app first loads
    checkSession();
  }, []);

  const login = async () => {
    // The backend just set our HttpOnly refresh token. 
    // Triggering checkSession will hit /users/me, fail (since we have no access token),
    // and then the interceptor will automatically hit /auth/refresh to get our new access token!
    await checkSession();
  };

  const logout = async () => {
    try {
      // Tell the backend to blacklist the token and destroy the Refresh Token cookie
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed on server, continuing local cleanup", e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      
      // If we are not already on login or register, redirect
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        getRouter().navigate({
          to: '/login',
          search: { redirectUrl: window.location.pathname + window.location.search } as any
        });
      }
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      // Clean up local state when the interceptor detects a dead session
      setUser(null);
      setIsAuthenticated(false);
      
      // We don't call backend logout here because the session is already dead
      if (typeof window !== 'undefined' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        getRouter().navigate({
          to: '/login',
          search: { redirectUrl: window.location.pathname + window.location.search } as any
        });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isLoading, login, logout, checkSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
