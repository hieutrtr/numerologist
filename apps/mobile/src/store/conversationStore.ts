import { create } from 'zustand';
import { Message } from '../types';

interface ConversationState {
  activeConversationId: string | null;
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  isAiTyping: boolean;
  transcriptionText: string;
  
  startConversation: () => Promise<string>;
  endConversation: (rating?: number) => Promise<void>;
  addMessage: (message: Message) => void;
  setRecording: (isRecording: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setAiTyping: (isAiTyping: boolean) => void;
  setTranscription: (text: string) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  activeConversationId: null,
  messages: [],
  isRecording: false,
  isProcessing: false,
  isAiTyping: false,
  transcriptionText: '',

  startConversation: async () => {
    // TODO: Call API to create conversation
    const conversationId = `conv-${Date.now()}`;
    set({ activeConversationId: conversationId, messages: [] });
    return conversationId;
  },

  endConversation: async (rating) => {
    // TODO: Call API to end conversation
    set({ 
      activeConversationId: null, 
      isRecording: false, 
      isProcessing: false,
      isAiTyping: false,
      transcriptionText: '',
    });
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setRecording: (isRecording) => set({ isRecording }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setAiTyping: (isAiTyping) => set({ isAiTyping }),
  setTranscription: (text) => set({ transcriptionText: text }),
  clearMessages: () => set({ messages: [] }),
}));
