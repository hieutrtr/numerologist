import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  birthDate: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken, refreshToken) => {
    AsyncStorage.setItem('accessToken', accessToken);
    AsyncStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  login: async (phone, otp) => {
    set({ isLoading: true });
    try {
      // TODO: Implement Azure AD B2C phone auth
      // For now, mock authentication
      const mockUser: User = {
        id: '123',
        phoneNumber: phone,
        fullName: 'Người dùng',
        birthDate: '1990-01-01',
      };
      const mockToken = 'mock-jwt-token';
      
      await get().setTokens(mockToken, mockToken);
      set({ user: mockUser, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
      ]);
      
      if (accessToken[1] && refreshToken[1]) {
        set({ 
          accessToken: accessToken[1], 
          refreshToken: refreshToken[1],
          isAuthenticated: true,
        });
        // TODO: Verify token and load user profile
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  },
}));
