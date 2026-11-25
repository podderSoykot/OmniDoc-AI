'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthStorage, UserProfile } from '@/lib/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    setMounted(true);
    const token = AuthStorage.getToken();
    const storedUser = AuthStorage.getUser();

    if (!token) {
      setUser(null);
      setLoading(false);
      if (!isPublicRoute) {
        window.location.href = '/login';
      }
      return;
    }

    // Immediately trust stored profile while validating in background
    if (storedUser) {
      setUser(storedUser);
      setLoading(false);
      if (isPublicRoute) {
        window.location.href = '/';
        return;
      }
    }

    // Verify token with backend
    api.getMe()
      .then((validated) => {
        setUser(validated);
        AuthStorage.setAuth(token, validated);
        setLoading(false);
        if (isPublicRoute) {
          window.location.href = '/';
        }
      })
      .catch(() => {
        // Token expired or invalid
        AuthStorage.clear();
        setUser(null);
        setLoading(false);
        if (!isPublicRoute) {
          window.location.href = '/login';
        }
      });
  }, [pathname, isPublicRoute]);

  const logout = () => {
    AuthStorage.clear();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {}
      setUser(null);
      window.location.replace('/login');
    }
  };

  const refreshUser = async () => {
    const token = AuthStorage.getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const validated = await api.getMe();
      setUser(validated);
      AuthStorage.setAuth(token, validated);
    } catch {
      logout();
    }
  };

  // SSR initial render or public routes: render instantly without full-screen blocker
  if (!mounted || isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // If loading on a protected route: show clean spinner
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <div className="absolute w-6 h-6 rounded-lg bg-indigo-600 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold tracking-wide text-slate-100">OmniDoc-AI Enterprise</p>
            <p className="text-xs text-slate-400">Verifying secure tenant credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in on a protected route, hold rendering while redirecting
  if (!user) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
