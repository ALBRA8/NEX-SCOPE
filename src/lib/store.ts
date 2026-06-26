import { create } from 'zustand';
import { ViewType, ChatMessage, Niche, Channel, VideoIdea } from './types';
import {
  checkClientAuth,
  cacheUserLocally,
  getCachedUser,
  type AuthUser,
} from './auth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types for saved records (what comes back from the API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SavedNicheRecord {
  id: string;
  nicheId: string;
  nicheName: string;
  category: string;
  nicheScore: number;
  createdAt: string;
}

interface SavedChannelRecord {
  id: string;
  channelId: string;
  channelName: string;
  subscribers: number;
  createdAt: string;
}

interface SavedPlanRecord {
  id: string;
  niche: string;
  audience: string;
  planData: string; // JSON string of VideoIdea[]
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // ── Saved niches ─────────────────────────────────────────
  savedNiches: string[]; // IDs for UI bookmark state (backward compat)
  savedNicheRecords: SavedNicheRecord[]; // full records from DB
  toggleSavedNiche: (niche: Niche) => Promise<void>;
  loadSavedNiches: () => Promise<void>;

  // ── Saved channels ──────────────────────────────────────
  savedChannels: string[];
  savedChannelRecords: SavedChannelRecord[];
  toggleSavedChannel: (channel: Channel | { id: string; name: string; subscribers: number }) => Promise<void>;
  loadSavedChannels: () => Promise<void>;

  // ── Chat messages ───────────────────────────────────────
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => Promise<void>;
  clearChat: () => Promise<void>;
  loadChatMessages: () => Promise<void>;

  // ── Content plans ───────────────────────────────────────
  savedPlans: SavedPlanRecord[];
  loadSavedPlans: () => Promise<void>;
  savePlan: (niche: string, audience: string, planData: VideoIdea[]) => Promise<{ success: boolean; error?: string }>;
  deletePlan: (id: string) => Promise<void>;

  // ── UI ──────────────────────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // ── Auth ────────────────────────────────────────────────
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

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  // ━━ Saved niches ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  savedNiches: [],
  savedNicheRecords: [],
  loadSavedNiches: async () => {
    try {
      const res = await fetch('/api/saved-niches', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const records: SavedNicheRecord[] = data.niches || [];
      set({
        savedNicheRecords: records,
        savedNiches: records.map((r) => r.nicheId),
      });
    } catch {
      // network error — keep current state
    }
  },
  toggleSavedNiche: async (niche: Niche) => {
    const { savedNiches } = get();
    const isSaved = savedNiches.includes(niche.id);

    // Optimistic UI update
    if (isSaved) {
      set((state) => ({
        savedNiches: state.savedNiches.filter((id) => id !== niche.id),
        savedNicheRecords: state.savedNicheRecords.filter((r) => r.nicheId !== niche.id),
      }));
    } else {
      set((state) => ({
        savedNiches: [...state.savedNiches, niche.id],
        savedNicheRecords: [
          {
            id: 'temp-' + niche.id,
            nicheId: niche.id,
            nicheName: niche.name,
            category: niche.category,
            nicheScore: niche.nicheScore,
            createdAt: new Date().toISOString(),
          },
          ...state.savedNicheRecords,
        ],
      }));
    }

    try {
      if (isSaved) {
        await fetch(
          `/api/saved-niches?nicheId=${encodeURIComponent(niche.id)}`,
          { method: 'DELETE', credentials: 'include' }
        );
      } else {
        await fetch('/api/saved-niches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nicheId: niche.id,
            nicheName: niche.name,
            category: niche.category,
            nicheScore: niche.nicheScore,
          }),
        });
      }
    } catch {
      // revert on error
      await get().loadSavedNiches();
    }
  },

  // ━━ Saved channels ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  savedChannels: [],
  savedChannelRecords: [],
  loadSavedChannels: async () => {
    try {
      const res = await fetch('/api/saved-channels', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const records: SavedChannelRecord[] = data.channels || [];
      set({
        savedChannelRecords: records,
        savedChannels: records.map((r) => r.channelId),
      });
    } catch {
      // keep current state
    }
  },
  toggleSavedChannel: async (channel) => {
    const { savedChannels } = get();
    const isSaved = savedChannels.includes(channel.id);

    if (isSaved) {
      set((state) => ({
        savedChannels: state.savedChannels.filter((id) => id !== channel.id),
        savedChannelRecords: state.savedChannelRecords.filter((r) => r.channelId !== channel.id),
      }));
    } else {
      set((state) => ({
        savedChannels: [...state.savedChannels, channel.id],
        savedChannelRecords: [
          {
            id: 'temp-' + channel.id,
            channelId: channel.id,
            channelName: channel.name,
            subscribers: (channel as any).subscribers || 0,
            createdAt: new Date().toISOString(),
          },
          ...state.savedChannelRecords,
        ],
      }));
    }

    try {
      if (isSaved) {
        await fetch(
          `/api/saved-channels?channelId=${encodeURIComponent(channel.id)}`,
          { method: 'DELETE', credentials: 'include' }
        );
      } else {
        await fetch('/api/saved-channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            channelId: channel.id,
            channelName: channel.name,
            subscribers: (channel as any).subscribers || 0,
          }),
        });
      }
    } catch {
      await get().loadSavedChannels();
    }
  },

  // ━━ Chat messages ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  chatMessages: [],
  loadChatMessages: async () => {
    try {
      const res = await fetch('/api/chat-messages', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const messages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
      set({ chatMessages: messages });
    } catch {
      // keep current state
    }
  },
  addChatMessage: async (message: ChatMessage) => {
    // Optimistic UI
    set((state) => ({ chatMessages: [...state.chatMessages, message] }));
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(message),
      });
    } catch {
      // network error — message stays in UI but not persisted
    }
  },
  clearChat: async () => {
    set({ chatMessages: [] });
    try {
      await fetch('/api/chat-messages', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
  },

  // ━━ Content plans ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  savedPlans: [],
  loadSavedPlans: async () => {
    try {
      const res = await fetch('/api/content-plans', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      set({ savedPlans: (data.plans || []) as SavedPlanRecord[] });
    } catch {
      // keep current state
    }
  },
  savePlan: async (niche, audience, planData) => {
    try {
      const res = await fetch('/api/content-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ niche, audience, planData }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Error al guardar plan' };
      }
      // Refresh list
      await get().loadSavedPlans();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  },
  deletePlan: async (id: string) => {
    // Optimistic
    set((state) => ({ savedPlans: state.savedPlans.filter((p) => p.id !== id) }));
    try {
      await fetch(`/api/content-plans?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // reload on error
      await get().loadSavedPlans();
    }
  },

  // ━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // ━━ Auth ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        // Step 3: Load all user data in parallel (non-blocking)
        // Don't await — let UI render first, data fills in as it arrives
        Promise.all([
          get().loadSavedNiches(),
          get().loadSavedChannels(),
          get().loadChatMessages(),
          get().loadSavedPlans(),
        ]).catch(() => {});
      } else {
        // Server says not authenticated — clear stale cache
        saveCachedUser(null);
        set({
          isAuthenticated: false,
          user: null,
          isAuthLoading: false,
          isHydrated: true,
          savedNiches: [],
          savedChannels: [],
          savedNicheRecords: [],
          savedChannelRecords: [],
          chatMessages: [],
          savedPlans: [],
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
            // Load user data
            Promise.all([
              get().loadSavedNiches(),
              get().loadSavedChannels(),
              get().loadChatMessages(),
              get().loadSavedPlans(),
            ]).catch(() => {});
            return { success: true };
          }
        }
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
        Promise.all([
          get().loadSavedNiches(),
          get().loadSavedChannels(),
          get().loadChatMessages(),
          get().loadSavedPlans(),
        ]).catch(() => {});
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    } catch {
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
            Promise.all([
              get().loadSavedNiches(),
              get().loadSavedChannels(),
              get().loadChatMessages(),
              get().loadSavedPlans(),
            ]).catch(() => {});
            return { success: true };
          }
        }
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
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  },
  quickStart: async () => {
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
            Promise.all([
              get().loadSavedNiches(),
              get().loadSavedChannels(),
              get().loadChatMessages(),
              get().loadSavedPlans(),
            ]).catch(() => {});
            return;
          }
        }
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
        // If registration fails, fall back to a pure guest mode (no persistence)
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
    } catch {
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
      // ignore
    }
    saveCachedUser(null);
    set({
      isAuthenticated: false,
      user: null,
      activeView: 'dashboard',
      savedNiches: [],
      savedChannels: [],
      savedNicheRecords: [],
      savedChannelRecords: [],
      chatMessages: [],
      savedPlans: [],
    });
  },
}));
