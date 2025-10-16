import { create } from 'zustand';
import type { ConversationMessage } from '@numerologist/shared';

/**
 * Transcription result from speech-to-text processing
 */
export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  alternatives: Array<{ text: string; confidence: number }>;
  timestamp: number;
}

/**
 * Recording state managed by Zustand
 */
interface ConversationState {
  activeConversationId: string | null;
  messages: ConversationMessage[];
  
  // Recording & transcription state
  isRecording: boolean;
  isProcessing: boolean;
  transcription: TranscriptionResult | null;
  audioLevel: number; // -160 to 0 dB
  
  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveConversation: (id: string) => void;
  addMessage: (message: ConversationMessage) => void;
  setRecording: (recording: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setTranscription: (result: TranscriptionResult | null) => void;
  setAudioLevel: (level: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTranscription: () => void;
  clearConversation: () => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  activeConversationId: null,
  messages: [],
  
  isRecording: false,
  isProcessing: false,
  transcription: null,
  audioLevel: -160,
  
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

  setProcessing: (processing: boolean) =>
    set({ isProcessing: processing }),

  setTranscription: (result: TranscriptionResult | null) =>
    set({ transcription: result }),

  setAudioLevel: (level: number) =>
    set({ audioLevel: level }),

  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  setError: (error: string | null) =>
    set({ error }),

  clearTranscription: () =>
    set({
      transcription: null,
      audioLevel: -160,
    }),

  clearConversation: () =>
    set({
      activeConversationId: null,
      messages: [],
      transcription: null,
      audioLevel: -160,
      error: null,
    }),

  reset: () =>
    set({
      activeConversationId: null,
      messages: [],
      isRecording: false,
      isProcessing: false,
      transcription: null,
      audioLevel: -160,
      isLoading: false,
      error: null,
    }),
}));
