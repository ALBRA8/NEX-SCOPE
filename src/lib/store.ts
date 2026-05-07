import { create } from 'zustand';
import { ViewType, ChatMessage } from './types';

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
}));
