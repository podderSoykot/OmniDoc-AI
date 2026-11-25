'use client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export const AuthStorage = {
  TOKEN_KEY: 'omnidoc_token',
  USER_KEY: 'omnidoc_user',

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setAuth(token: string, user: UserProfile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
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
    localStorage.removeItem(this.USER_KEY);
  }
};
