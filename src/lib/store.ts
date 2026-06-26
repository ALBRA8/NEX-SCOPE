import { create } from 'zustand';
import { ViewType, ChatMessage } from './types';
import {
  checkClientAuth,
  cacheUserLocally,
  getCachedUser,
  type AuthUser,
} from './auth';

interface AppState {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  savedNiches: string[];
  toggleSavedNiche: (nicheId: string) => void;
  savedChannels: string[];
  toggleSavedChannel: (channelId: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // Auth
  isAuthenticated: boolean;
  isHydrated: boolean;
  isAuthLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickStart: () => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

const CACHE_KEY = 'nexscope_user_cache';

function loadCachedUser(): AuthUser | null {
  return getCachedUser();
}

function saveCachedUser(user: AuthUser | null) {
  cacheUserLocally(user);
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  savedNiches: [],
  toggleSavedNiche: (nicheId) =>
    set((state) => ({
      savedNiches: state.savedNiches.includes(nicheId)
        ? state.savedNiches.filter((id) => id !== nicheId)
        : [...state.savedNiches, nicheId],
    })),
  savedChannels: [],
  toggleSavedChannel: (channelId) =>
    set((state) => ({
      savedChannels: state.savedChannels.includes(channelId)
        ? state.savedChannels.filter((id) => id !== channelId)
        : [...state.savedChannels, channelId],
    })),
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  // ━━ Auth ━━
  isAuthenticated: false,
  isHydrated: false,
  isAuthLoading: false,
  user: null,
  initAuth: async () => {
    // Step 1: Hydrate from localStorage cache for instant UI render
    const cachedUser = loadCachedUser();
    if (cachedUser) {
      set({ isAuthenticated: true, user: cachedUser, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }

    // Step 2: Verify with server (httpOnly JWT cookie is source of truth)
    set({ isAuthLoading: true });
    try {
      const { authenticated, user } = await checkClientAuth();
      if (authenticated && user) {
        saveCachedUser(user);
        set({
          isAuthenticated: true,
          user,
          isAuthLoading: false,
          isHydrated: true,
        });
      } else {
        // Server says not authenticated — clear stale cache
        saveCachedUser(null);
        set({
          isAuthenticated: false,
          user: null,
          isAuthLoading: false,
          isHydrated: true,
        });
      }
    } catch {
      // Network error: keep cached state, mark as not loading
      set({ isAuthLoading: false });
    }
  },
  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        // Fetch full user info (includes createdAt)
        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            saveCachedUser(meData.user);
            set({
              isAuthenticated: true,
              user: meData.user,
              isHydrated: true,
            });
            return { success: true };
          }
        }
        // Fallback: use minimal user info from login response
        const minimalUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: new Date(),
        };
        saveCachedUser(minimalUser);
        set({
          isAuthenticated: true,
          user: minimalUser,
          isHydrated: true,
        });
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  },
  register: async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        // Fetch full user info (includes createdAt)
        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            saveCachedUser(meData.user);
            set({
              isAuthenticated: true,
              user: meData.user,
              isHydrated: true,
            });
            return { success: true };
          }
        }
        // Fallback: use minimal user info
        const minimalUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: new Date(),
        };
        saveCachedUser(minimalUser);
        set({
          isAuthenticated: true,
          user: minimalUser,
          isHydrated: true,
        });
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al registrar' };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  },
  quickStart: async () => {
    // Quick start now creates a real guest account with a random password
    // so the user gets a real JWT cookie instead of fake localStorage state.
    try {
      const randomId = Math.random().toString(36).substring(2, 12);
      const guestEmail = `guest_${randomId}@nexscope.app`;
      const guestPassword = `guest_${randomId}_${Date.now()}`;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `Invitado ${randomId.slice(0, 4).toUpperCase()}`,
          email: guestEmail,
          password: guestPassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            saveCachedUser(meData.user);
            set({
              isAuthenticated: true,
              user: meData.user,
              isHydrated: true,
            });
            return;
          }
        }
        // Fallback
        const minimalUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: new Date(),
        };
        saveCachedUser(minimalUser);
        set({
          isAuthenticated: true,
          user: minimalUser,
          isHydrated: true,
        });
      } else {
        // If registration fails (e.g., email collision), fall back to a pure guest mode
        // without server auth — but this won't have persistent data.
        const guestUser: AuthUser = {
          id: `guest_${randomId}`,
          name: 'Invitado',
          email: guestEmail,
          createdAt: new Date(),
        };
        saveCachedUser(guestUser);
        set({
          isAuthenticated: true,
          user: guestUser,
          isHydrated: true,
        });
      }
    } catch (err) {
      // Network error fallback: pure client-side guest (no persistence)
      const randomId = Math.random().toString(36).substring(2, 12);
      const guestUser: AuthUser = {
        id: `guest_${randomId}`,
        name: 'Invitado',
        email: `guest_${randomId}@nexscope.app`,
        createdAt: new Date(),
      };
      saveCachedUser(guestUser);
      set({
        isAuthenticated: true,
        user: guestUser,
        isHydrated: true,
      });
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore network errors
    }
    saveCachedUser(null);
    set({
      isAuthenticated: false,
      user: null,
      activeView: 'dashboard',
      savedNiches: [],
      savedChannels: [],
      chatMessages: [],
    });
  },
}));
