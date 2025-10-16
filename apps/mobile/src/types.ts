// Type definitions for Numeroly app

export type VoiceButtonState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'disabled';

export interface VoiceButtonProps {
  size?: 'small' | 'medium' | 'large';
  state: VoiceButtonState;
  onPress: () => void;
  audioAmplitude?: number;
  label?: string;
}

export interface Message {
  id: string;
  text: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  isTyping?: boolean;
  audioUrl?: string;
}

export interface ConversationTranscriptProps {
  messages: Message[];
  isAiTyping: boolean;
  onMessageTap?: (messageId: string) => void;
  onMessageLongPress?: (messageId: string) => void;
  maxHeight?: number;
}

export interface User {
  id: string;
  phoneNumber: string;
  fullName?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ConversationState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  isAiTyping: boolean;
}

export type NumerologyType = 'lifePath' | 'destiny' | 'soul' | 'personality';

export interface NumerologyCard {
  number: number;
  type: NumerologyType;
  title: string;
  subtitle: string;
  meaning: string;
}

export interface NumerologyCardProps extends NumerologyCard {
  animateOnMount?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export interface NumerologyProfile {
  id: string;
  userId: string;
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  currentPersonalYear: number;
  currentPersonalMonth: number;
  calculatedAt: string;
  interpretations: {
    [key: string]: string;
  };
}

export interface WaveformVisualizerProps {
  mode: 'listening' | 'speaking' | 'idle';
  barCount?: number;
  height?: number;
  amplitudeData?: number[];
  isActive?: boolean;
}
