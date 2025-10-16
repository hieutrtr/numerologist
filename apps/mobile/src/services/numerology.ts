import { apiClient } from './api';
import type { NumerologyProfile } from '../types';

interface CreateProfileRequest {
  fullName: string;
  birthDate: string; // ISO format: YYYY-MM-DD
}

interface ApiErrorResponse {
  detail?: string | Array<{ msg: string }>;
  error?: string;
}

const VIETNAMESE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_BIRTH_DATE: 'Ngày sinh không hợp lệ. Vui lòng nhập ngày chính xác.',
  EMPTY_NAME: 'Tên không được để trống. Vui lòng nhập tên của bạn.',
  NAME_TOO_LONG: 'Tên quá dài. Vui lòng nhập tên ngắn hơn.',
  INVALID_FORMAT: 'Định dạng không hợp lệ. Vui lòng kiểm tra lại.',
  INVALID_DATE_RANGE: 'Ngày sinh phải trong khoảng từ 1900 đến hôm nay.',
  FUTURE_DATE: 'Ngày sinh không thể là ngày trong tương lai.',
  API_ERROR: 'Không thể tính toán số học. Vui lòng thử lại.',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng của bạn.',
  TIMEOUT_ERROR: 'Yêu cầu vượt quá thời gian chờ. Vui lòng thử lại.',
};

/**
 * Map API error responses to Vietnamese user-facing messages
 */
function mapApiErrorToMessage(error: unknown): string {
  if (error instanceof TypeError) {
    if (error.message.includes('Network')) {
      return VIETNAMESE_ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return VIETNAMESE_ERROR_MESSAGES.TIMEOUT_ERROR;
    }
  }

  if (error && typeof error === 'object') {
    const apiError = error as ApiErrorResponse;

    if (apiError.detail) {
      if (typeof apiError.detail === 'string') {
        // Check for known error patterns
        if (apiError.detail.includes('birth_date')) {
          return VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE;
        }
        if (apiError.detail.includes('full_name')) {
          return VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME;
        }
        if (apiError.detail.includes('future')) {
          return VIETNAMESE_ERROR_MESSAGES.FUTURE_DATE;
        }
      } else if (Array.isArray(apiError.detail)) {
        const firstError = apiError.detail[0];
        if (firstError?.msg) {
          if (firstError.msg.includes('birth_date')) {
            return VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE;
          }
          if (firstError.msg.includes('full_name')) {
            return VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME;
          }
        }
      }
    }
  }

  return VIETNAMESE_ERROR_MESSAGES.API_ERROR;
}

/**
 * Validate birth date format (YYYY-MM-DD)
 */
function validateBirthDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate name is not empty and reasonable length
 */
function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length < 100;
}

/**
 * Fetch or create numerology profile with retry logic
 * Implements exponential backoff: 1s, 2s, 4s (max 3 attempts)
 */
export async function fetchNumerologyProfile(
  fullName: string,
  birthDate: string
): Promise<NumerologyProfile> {
  // Validate inputs
  if (!validateBirthDateFormat(birthDate)) {
    throw new Error(VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE);
  }

  if (!validateName(fullName)) {
    throw new Error(VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME);
  }

  const request: CreateProfileRequest = {
    fullName: fullName.trim(),
    birthDate,
  };

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

      const response = await apiClient.post<NumerologyProfile>(
        '/numerology/profile',
        request
      );

      clearTimeout(timeoutId);

      if (response.status === 201 || response.status === 200) {
        return response.data;
      }

      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on validation errors (4xx)
      if (error instanceof Error) {
        if (
          error.message.includes('400') ||
          error.message.includes('422') ||
          error.message.includes('validation')
        ) {
          throw new Error(mapApiErrorToMessage(error));
        }
      }

      // Calculate backoff delay: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(mapApiErrorToMessage(lastError));
}

/**
 * Get existing numerology profile for user
 */
export async function getNumerologyProfile(
  userId: string
): Promise<NumerologyProfile> {
  try {
    const response = await apiClient.get<NumerologyProfile>(
      `/numerology/profile/${userId}`
    );

    if (response.status === 200) {
      return response.data;
    }

    throw new Error(`Unexpected status code: ${response.status}`);
  } catch (error) {
    throw new Error(mapApiErrorToMessage(error));
  }
}

/**
 * Update numerology profile (if name or birthDate changes)
 */
export async function updateNumerologyProfile(
  userId: string,
  fullName: string,
  birthDate: string
): Promise<NumerologyProfile> {
  // Validate inputs
  if (!validateBirthDateFormat(birthDate)) {
    throw new Error(VIETNAMESE_ERROR_MESSAGES.INVALID_BIRTH_DATE);
  }

  if (!validateName(fullName)) {
    throw new Error(VIETNAMESE_ERROR_MESSAGES.EMPTY_NAME);
  }

  const request: CreateProfileRequest = {
    fullName: fullName.trim(),
    birthDate,
  };

  try {
    const response = await apiClient.put<NumerologyProfile>(
      `/numerology/profile/${userId}`,
      request
    );

    if (response.status === 200) {
      return response.data;
    }

    throw new Error(`Unexpected status code: ${response.status}`);
  } catch (error) {
    throw new Error(mapApiErrorToMessage(error));
  }
}

export { VIETNAMESE_ERROR_MESSAGES };
