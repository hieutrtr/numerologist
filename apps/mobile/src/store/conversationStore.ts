import { create } from 'zustand';
import { Message } from '../types';

interface ConversationState {
  activeConversationId: string | null;
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  isAiTyping: boolean;
  transcriptionText: string;
  dailyRoomUrl: string | null;
  dailyToken: string | null;

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
  dailyRoomUrl: null,
  dailyToken: null,

  startConversation: async () => {
    try {
      // Story 1.2c: Call backend API to create Daily.co room and get token
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

      // TODO: Get user ID from auth store
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await fetch(`${apiUrl}/api/v1/conversations/daily/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create conversation: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const conversationId = data.conversation_id;
      const roomUrl = data.room_url;
      const token = data.token;

      console.log('[Backend] Conversation created with Daily.co room:', { conversationId, roomUrl });

      set({
        activeConversationId: conversationId,
        messages: [],
        dailyRoomUrl: roomUrl,
        dailyToken: token,
      });

      return conversationId;
    } catch (error) {
      console.error('[Backend] Failed to start conversation:', error);
      throw error;
    }
  },

  endConversation: async (rating) => {
    try {
      const conversationId = get().activeConversationId;
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      // Story 1.2c: Call backend API to end conversation and cleanup Daily.co room
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if available (TODO: get from auth store)
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        console.warn(`Failed to end conversation: ${response.statusText}`);
      }

      console.log('[Backend] Conversation ended:', conversationId);

      set({
        activeConversationId: null,
        isRecording: false,
        isProcessing: false,
        isAiTyping: false,
        transcriptionText: '',
        dailyRoomUrl: null,
        dailyToken: null,
      });
    } catch (error) {
      console.error('[Backend] Failed to end conversation:', error);
      throw error;
    }
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
