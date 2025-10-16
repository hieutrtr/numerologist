/**
 * Mobile App Types
 * Re-exports types from shared library and defines mobile-specific types
 */

export type {
  NumerologyProfile,
  NumerologyProfileResponse,
  NumerologyInterpretations,
  NumerologyInsight,
  NumerologyInsightRequest,
  NumerologyNumber,
  NumberInterpretation,
} from '@numerology/shared/types';

// Mobile-specific types
export interface UserStore {
  userId: string | null;
  authToken: string | null;
  isAuthenticated: boolean;
  numerologyProfile: NumerologyProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  setNumerologyProfile: (profile: NumerologyProfile) => void;
  setLoadingProfile: (loading: boolean) => void;
  setProfileError: (error: string | null) => void;
  setUserId: (userId: string) => void;
  setAuthToken: (token: string) => void;
}

export interface ConversationSession {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  userName?: string;
  birthDate?: string;
  concern?: string;
}
