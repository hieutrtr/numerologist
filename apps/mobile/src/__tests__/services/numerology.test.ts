import {
  fetchNumerologyProfile,
  getNumerologyProfile,
  updateNumerologyProfile,
  VIETNAMESE_ERROR_MESSAGES,
} from '../../services/numerology';
import { apiClient } from '../../services/api';
import type { NumerologyProfile } from '../../types';

// Mock the apiClient
jest.mock('../../services/api');

describe('Numerology Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('fetchNumerologyProfile', () => {
    it('should fetch profile successfully on first attempt', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        status: 201,
        data: mockProfile,
      });

      const result = await fetchNumerologyProfile(
        'Nguyễn Văn A',
        '1990-03-15'
      );

      expect(result).toEqual(mockProfile);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/numerology/profile',
        {
          fullName: 'Nguyễn Văn A',
          birthDate: '1990-03-15',
        }
      );
    });

    it('should retry on network error with exponential backoff', async () => {
      const networkError = new Error('Network Error');

      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          status: 201,
          data: mockProfile,
        });

      jest.useFakeTimers();

      const promise = fetchNumerologyProfile('Nguyễn Văn A', '1990-03-15');

      // Advance time for first retry (1s)
      await jest.advanceTimersByTimeAsync(1000);

      // Advance time for second retry (2s)
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;
      jest.useRealTimers();

      expect(result).toEqual(mockProfile);
      expect(apiClient.post).toHaveBeenCalledTimes(3);
    });

    it('should fail with invalid birth date format', async () => {
      const promise = fetchNumerologyProfile('Nguyễn Văn A', 'invalid-date');

      await expect(promise).rejects.toThrow(
        VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should fail with empty name', async () => {
      const promise = fetchNumerologyProfile('', '1990-03-15');

      await expect(promise).rejects.toThrow(
        VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should fail with name too long', async () => {
      const longName = 'A'.repeat(101);
      const promise = fetchNumerologyProfile(longName, '1990-03-15');

      await expect(promise).rejects.toThrow(
        VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should return error after max retries exhausted', async () => {
      const networkError = new Error('Network Error');

      (apiClient.post as jest.Mock).mockRejectedValue(networkError);

      jest.useFakeTimers();

      const promise = fetchNumerologyProfile('Nguyễn Văn A', '1990-03-15');

      // Advance through all retry delays
      await jest.advanceTimersByTimeAsync(7000); // 1s + 2s + 4s

      await expect(promise).rejects.toThrow();
      jest.useRealTimers();

      expect(apiClient.post).toHaveBeenCalledTimes(3);
    });

    it('should trim whitespace from name', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        status: 201,
        data: mockProfile,
      });

      await fetchNumerologyProfile('  Nguyễn Văn A  ', '1990-03-15');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/numerology/profile',
        {
          fullName: 'Nguyễn Văn A',
          birthDate: '1990-03-15',
        }
      );
    });
  });

  describe('getNumerologyProfile', () => {
    it('should get existing profile successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockProfile,
      });

      const result = await getNumerologyProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(apiClient.get).toHaveBeenCalledWith('/numerology/profile/user-1');
    });

    it('should handle API error when profile not found', async () => {
      const error = new Error('404: Not Found');

      (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getNumerologyProfile('user-1')).rejects.toThrow();
    });
  });

  describe('updateNumerologyProfile', () => {
    it('should update profile successfully', async () => {
      const updatedProfile: NumerologyProfile = {
        ...mockProfile,
        lifePathNumber: 5,
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: updatedProfile,
      });

      const result = await updateNumerologyProfile(
        'user-1',
        'Nguyễn Văn B',
        '1995-05-20'
      );

      expect(result).toEqual(updatedProfile);
      expect(apiClient.put).toHaveBeenCalledWith('/numerology/profile/user-1', {
        fullName: 'Nguyễn Văn B',
        birthDate: '1995-05-20',
      });
    });

    it('should validate birth date on update', async () => {
      const promise = updateNumerologyProfile(
        'user-1',
        'Nguyễn Văn A',
        'invalid-date'
      );

      await expect(promise).rejects.toThrow(
        VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE
      );
      expect(apiClient.put).not.toHaveBeenCalled();
    });

    it('should validate name on update', async () => {
      const promise = updateNumerologyProfile('user-1', '', '1990-03-15');

      await expect(promise).rejects.toThrow(
        VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME
      );
      expect(apiClient.put).not.toHaveBeenCalled();
    });
  });

  describe('Error Message Mapping', () => {
    it('should map network errors to Vietnamese message', async () => {
      const networkError = new TypeError('Network request failed');

      (apiClient.post as jest.Mock).mockRejectedValue(networkError);

      jest.useFakeTimers();

      const promise = fetchNumerologyProfile('Nguyễn Văn A', '1990-03-15');

      await jest.advanceTimersByTimeAsync(7000);

      try {
        await promise;
      } catch (error) {
        expect((error as Error).message).toBe(
          VIETNAMESE_ERROR_MESSAGES.NETWORK_ERROR
        );
      }

      jest.useRealTimers();
    });

    it('should map validation errors to Vietnamese message', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 422 },
        message: 'Validation error',
      });

      jest.useFakeTimers();

      const promise = fetchNumerologyProfile('Nguyễn Văn A', '1990-03-15');

      await jest.advanceTimersByTimeAsync(7000);

      try {
        await promise;
      } catch (error) {
        expect((error as Error).message).toBe(
          VIETNAMESE_ERROR_MESSAGES.API_ERROR
        );
      }

      jest.useRealTimers();
    });
  });
});
