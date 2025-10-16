import { create } from 'zustand';
import type { ConversationMessage } from '@numerologist/shared';

interface ConversationState {
  activeConversationId: string | null;
  messages: ConversationMessage[];
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveConversation: (id: string) => void;
  addMessage: (message: ConversationMessage) => void;
  setRecording: (recording: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearConversation: () => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  activeConversationId: null,
  messages: [],
  isRecording: false,
  isLoading: false,
  error: null,

  setActiveConversation: (id: string) =>
    set({ activeConversationId: id }),

  addMessage: (message: ConversationMessage) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setRecording: (recording: boolean) =>
    set({ isRecording: recording }),

  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  setError: (error: string | null) =>
    set({ error }),

  clearConversation: () =>
    set({
      activeConversationId: null,
      messages: [],
      error: null,
    }),

  reset: () =>
    set({
      activeConversationId: null,
      messages: [],
      isRecording: false,
      isLoading: false,
      error: null,
    }),
}));
