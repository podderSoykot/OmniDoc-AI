'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = AuthStorage.getToken();
    const storedUser = AuthStorage.getUser();

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    if (!token) {
      setUser(null);
      setLoading(false);
      if (!isPublicRoute) {
        router.replace('/login');
      }
      return;
    }

    // Token exists, initialize user immediately from storage
    if (storedUser) {
      setUser(storedUser);
    }

    // Validate token with backend /auth/me
    try {
      const validated = await api.getMe();
      setUser(validated);
      AuthStorage.setAuth(token, validated);
      if (isPublicRoute) {
        router.replace('/');
      }
    } catch (err) {
      // Token expired or invalid
      AuthStorage.clear();
      setUser(null);
      if (!isPublicRoute) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const logout = () => {
    AuthStorage.clear();
    setUser(null);
    router.replace('/login');
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // If user is already on a public route (like /login or /signup) and has no token, don't show full-screen loader
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
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

  // If not logged in and on a protected route, block rendering until redirected
  if (!user && !isPublicRoute) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
