import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getAccessToken, prefetchToken } from "../lib/api";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      // Eagerly fetch token if missing to avoid intentional 401
      if (!getAccessToken()) {
        try {
          await prefetchToken();
        } catch {
          // prefetch failed, session is truly dead
          return null;
        }
      }
      
      const response = await api.get('/users/me');
      return response.data as UserProfile;
    },
    // We let the Axios interceptor handle 401 retries. If the request fails permanently,
    // the session is dead.
    retry: false,
  });

  const isAuthenticated = !!user && !isError;

  const checkSession = async () => {
    // Invalidate the query to force a refetch
    await queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const login = async () => {
    await checkSession();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      // Only clear local session if server confirms logout, because HttpOnly cookie remains otherwise.
      queryClient.setQueryData(['user'], null);
      
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        getRouter().navigate({
          to: '/login',
          search: { redirectUrl: window.location.pathname + window.location.search } as any
        });
      }
    } catch (e) {
      console.error("Logout failed on server", e);
      toast.error("Logout failed. Please try again or check your connection.");
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(['user'], null);
      
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
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user: user || null, isLoading, login, logout, checkSession }}
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
