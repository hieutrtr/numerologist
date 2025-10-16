/**
 * User domain types
 */

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  birthDate: Date;
  email?: string;
  createdAt: Date;
  lastActiveAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  voiceSpeed?: number;
  voiceTone?: 'warm' | 'neutral' | 'energetic';
  volume?: number;
  notificationsEnabled?: boolean;
  dialectPreference?: 'northern' | 'southern' | 'central';
  interactionStyle?: 'formal' | 'casual';
}

export interface UserResponse {
  id: string;
  phoneNumber: string;
  fullName: string;
  birthDate: string;
  email?: string;
  createdAt: string;
  lastActiveAt: string;
  preferences: UserPreferences;
}

export interface CreateUserRequest {
  phoneNumber: string;
  fullName: string;
  birthDate: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  birthDate?: string;
  email?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}
