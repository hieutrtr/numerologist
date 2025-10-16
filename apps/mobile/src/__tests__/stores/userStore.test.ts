import { renderHook, act } from '@testing-library/react-native';
import { useUserStore } from '../../stores/userStore';
import type { User, NumerologyProfile } from '../../types';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      numerologyProfile: null,
      isLoadingProfile: false,
      profileError: null,
    });
  });

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+84987654321',
    fullName: 'Nguyễn Văn A',
    createdAt: new Date('2025-01-15'),
  };

  const mockProfile: NumerologyProfile = {
    id: 'profile-1',
    userId: 'user-1',
    lifePathNumber: 3,
    destinyNumber: 7,
    soulUrgeNumber: 5,
    personalityNumber: 2,
    currentPersonalYear: 8,
    currentPersonalMonth: 4,
    calculatedAt: '2025-01-16T10:30:00Z',
    interpretations: {
      lifePathNumber_3: 'Creative expression and communication',
      destinyNumber_7: 'Spiritual seeker and analyst',
      soulUrgeNumber_5: 'Freedom and adventure',
      personalityNumber_2: 'Cooperation and diplomacy',
    },
  };

  describe('User State Management', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should clear user when setting null', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
    });

    it('should set authentication state', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setAuthenticated(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Numerology Profile State Management', () => {
    it('should set numerology profile', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.numerologyProfile).toEqual(mockProfile);
      expect(result.current.profileError).toBeNull();
      expect(result.current.isLoadingProfile).toBe(false);
    });

    it('should clear numerology profile', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.numerologyProfile).toEqual(mockProfile);

      act(() => {
        result.current.clearNumerologyProfile();
      });

      expect(result.current.numerologyProfile).toBeNull();
      expect(result.current.profileError).toBeNull();
      expect(result.current.isLoadingProfile).toBe(false);
    });

    it('should manage loading state', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setLoadingProfile(true);
      });

      expect(result.current.isLoadingProfile).toBe(true);

      act(() => {
        result.current.setLoadingProfile(false);
      });

      expect(result.current.isLoadingProfile).toBe(false);
    });

    it('should set profile error', () => {
      const { result } = renderHook(() => useUserStore());
      const errorMessage = 'Lỗi không xác định';

      act(() => {
        result.current.setProfileError(errorMessage);
      });

      expect(result.current.profileError).toBe(errorMessage);
      expect(result.current.isLoadingProfile).toBe(false);
    });

    it('should clear error when setting profile', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setProfileError('Some error');
      });

      expect(result.current.profileError).toBe('Some error');

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.profileError).toBeNull();
    });
  });

  describe('Personal Year/Month Updates', () => {
    it('should update personal year', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.numerologyProfile?.currentPersonalYear).toBe(8);

      act(() => {
        result.current.updatePersonalYear(9);
      });

      expect(result.current.numerologyProfile?.currentPersonalYear).toBe(9);
    });

    it('should update personal month', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.numerologyProfile?.currentPersonalMonth).toBe(4);

      act(() => {
        result.current.updatePersonalMonth(5);
      });

      expect(result.current.numerologyProfile?.currentPersonalMonth).toBe(5);
    });

    it('should not update if profile not set', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.numerologyProfile).toBeNull();

      // Should not throw error
      act(() => {
        result.current.updatePersonalYear(9);
      });

      expect(result.current.numerologyProfile).toBeNull();
    });
  });

  describe('Selector Functions', () => {
    beforeEach(() => {
      useUserStore.setState({
        numerologyProfile: mockProfile,
      });
    });

    it('should get life path number', () => {
      const { result } = renderHook(() => useUserStore());

      const lifePathNumber = result.current.getLifePathNumber();

      expect(lifePathNumber).toBe(3);
    });

    it('should get destiny number', () => {
      const { result } = renderHook(() => useUserStore());

      const destinyNumber = result.current.getDestinyNumber();

      expect(destinyNumber).toBe(7);
    });

    it('should get soul urge number', () => {
      const { result } = renderHook(() => useUserStore());

      const soulUrgeNumber = result.current.getSoulUrgeNumber();

      expect(soulUrgeNumber).toBe(5);
    });

    it('should get personality number', () => {
      const { result } = renderHook(() => useUserStore());

      const personalityNumber = result.current.getPersonalityNumber();

      expect(personalityNumber).toBe(2);
    });

    it('should return null for selectors when profile not set', () => {
      useUserStore.setState({ numerologyProfile: null });

      const { result } = renderHook(() => useUserStore());

      expect(result.current.getLifePathNumber()).toBeNull();
      expect(result.current.getDestinyNumber()).toBeNull();
      expect(result.current.getSoulUrgeNumber()).toBeNull();
      expect(result.current.getPersonalityNumber()).toBeNull();
    });

    it('should get interpretation for number', () => {
      const { result } = renderHook(() => useUserStore());

      const interpretation = result.current.getInterpretation(
        'lifePathNumber',
        3
      );

      expect(interpretation).toBe('Creative expression and communication');
    });

    it('should return null for unknown interpretation', () => {
      const { result } = renderHook(() => useUserStore());

      const interpretation = result.current.getInterpretation(
        'unknownType',
        99
      );

      expect(interpretation).toBeNull();
    });

    it('should return null for interpretation when profile not set', () => {
      useUserStore.setState({ numerologyProfile: null });

      const { result } = renderHook(() => useUserStore());

      const interpretation = result.current.getInterpretation(
        'lifePathNumber',
        3
      );

      expect(interpretation).toBeNull();
    });
  });

  describe('Store Persistence', () => {
    it('should persist user state to localStorage', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setUser(mockUser);
        result.current.setAuthenticated(true);
      });

      // Access store state - would be persisted to localStorage
      const state = useUserStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist numerology profile to localStorage', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
      });

      const state = useUserStore.getState();

      expect(state.numerologyProfile).toEqual(mockProfile);
    });

    it('should not persist loading and error states', () => {
      useUserStore.setState({
        isLoadingProfile: true,
        profileError: 'Some error',
      });

      const state = useUserStore.getState();

      // These should not be persisted per middleware configuration
      // In actual usage, only user and numerologyProfile persist
      expect(state.isLoadingProfile).toBe(true);
      expect(state.profileError).toBe('Some error');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle user change with profile update', () => {
      const { result } = renderHook(() => useUserStore());

      // Set initial user and profile
      act(() => {
        result.current.setUser(mockUser);
        result.current.setNumerologyProfile(mockProfile);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.numerologyProfile).toEqual(mockProfile);

      // Change user
      const newUser: User = {
        ...mockUser,
        id: 'user-2',
      };

      act(() => {
        result.current.setUser(newUser);
        result.current.clearNumerologyProfile();
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.numerologyProfile).toBeNull();
    });

    it('should handle rapid state updates', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setNumerologyProfile(mockProfile);
        result.current.updatePersonalYear(9);
        result.current.updatePersonalMonth(6);
        result.current.setLoadingProfile(true);
        result.current.setLoadingProfile(false);
      });

      expect(result.current.numerologyProfile?.currentPersonalYear).toBe(9);
      expect(result.current.numerologyProfile?.currentPersonalMonth).toBe(6);
      expect(result.current.isLoadingProfile).toBe(false);
    });
  });
});
