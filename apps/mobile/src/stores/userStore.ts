import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, NumerologyProfile } from '../types';

interface UserState {
  // User authentication state
  user: User | null;
  isAuthenticated: boolean;

  // Numerology profile state
  numerologyProfile: NumerologyProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;

  // Numerology profile actions
  setNumerologyProfile: (profile: NumerologyProfile | null) => void;
  setLoadingProfile: (isLoading: boolean) => void;
  setProfileError: (error: string | null) => void;
  clearNumerologyProfile: () => void;
  updatePersonalYear: (year: number) => void;
  updatePersonalMonth: (month: number) => void;

  // Selectors
  getLifePathNumber: () => number | null;
  getDestinyNumber: () => number | null;
  getSoulUrgeNumber: () => number | null;
  getPersonalityNumber: () => number | null;
  getInterpretation: (numberType: string, value: number) => string | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      numerologyProfile: null,
      isLoadingProfile: false,
      profileError: null,

      // User actions
      setUser: (user: User | null) => set({ user }),

      setAuthenticated: (isAuthenticated: boolean) =>
        set({ isAuthenticated }),

      // Numerology profile actions
      setNumerologyProfile: (profile: NumerologyProfile | null) =>
        set({
          numerologyProfile: profile,
          profileError: null,
          isLoadingProfile: false,
        }),

      setLoadingProfile: (isLoading: boolean) =>
        set({ isLoadingProfile: isLoading }),

      setProfileError: (error: string | null) =>
        set({
          profileError: error,
          isLoadingProfile: false,
        }),

      clearNumerologyProfile: () =>
        set({
          numerologyProfile: null,
          profileError: null,
          isLoadingProfile: false,
        }),

      updatePersonalYear: (year: number) => {
        const state = get();
        if (state.numerologyProfile) {
          set({
            numerologyProfile: {
              ...state.numerologyProfile,
              currentPersonalYear: year,
            },
          });
        }
      },

      updatePersonalMonth: (month: number) => {
        const state = get();
        if (state.numerologyProfile) {
          set({
            numerologyProfile: {
              ...state.numerologyProfile,
              currentPersonalMonth: month,
            },
          });
        }
      },

      // Selector functions
      getLifePathNumber: () => {
        const state = get();
        return state.numerologyProfile?.lifePathNumber ?? null;
      },

      getDestinyNumber: () => {
        const state = get();
        return state.numerologyProfile?.destinyNumber ?? null;
      },

      getSoulUrgeNumber: () => {
        const state = get();
        return state.numerologyProfile?.soulUrgeNumber ?? null;
      },

      getPersonalityNumber: () => {
        const state = get();
        return state.numerologyProfile?.personalityNumber ?? null;
      },

      getInterpretation: (numberType: string, value: number) => {
        const state = get();
        if (!state.numerologyProfile?.interpretations) {
          return null;
        }

        const key = `${numberType}_${value}`;
        return state.numerologyProfile.interpretations[key] ?? null;
      },
    }),
    {
      name: 'user-store', // LocalStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        numerologyProfile: state.numerologyProfile,
      }),
    }
  )
);
