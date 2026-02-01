import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set isAuthenticated based on whether we have a user/token
        // and set isLoading to false
        if (state) {
          state.isAuthenticated = !!(state.user && state.token);
          state.isLoading = false;
        }
      },
    }
  )
);
