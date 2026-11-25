'use client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export const AuthStorage = {
  TOKEN_KEY: 'omnidoc_token',
  REFRESH_TOKEN_KEY: 'omnidoc_refresh_token',
  USER_KEY: 'omnidoc_user',

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  setAuth(token: string, arg2: string | null | UserProfile, arg3?: UserProfile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);

    if (typeof arg2 === 'string') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, arg2);
      if (arg3) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(arg3));
      }
    } else if (arg2 === null && arg3) {
      if (arg3) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(arg3));
      }
    } else if (arg2 && typeof arg2 === 'object') {
      // 2-argument call: setAuth(token, user)
      localStorage.setItem(this.USER_KEY, JSON.stringify(arg2));
    }
  },

  updateAccessToken(newToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, newToken);
  },

  getUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
};
