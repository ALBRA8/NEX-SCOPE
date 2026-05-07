import { create } from 'zustand';
import { ViewType, ChatMessage } from './types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

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
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => void;
}

const STORAGE_KEY = 'nichescope_user';

function loadUserFromStorage(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return null;
}

function saveUserToStorage(user: UserInfo | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
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
  // Auth
  isAuthenticated: false,
  user: null,
  initAuth: () => {
    const user = loadUserFromStorage();
    if (user) {
      set({ isAuthenticated: true, user });
    }
  },
  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveUserToStorage(data.user);
        set({ isAuthenticated: true, user: data.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  register: async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveUserToStorage(data.user);
        set({ isAuthenticated: true, user: data.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  logout: () => {
    saveUserToStorage(null);
    set({ isAuthenticated: false, user: null, activeView: 'dashboard' });
  },
}));
