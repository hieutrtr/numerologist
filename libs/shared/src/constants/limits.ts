/**
 * Application limits and constraints
 */

export const LIMITS = {
  // Voice
  MAX_AUDIO_DURATION_MS: 300000, // 5 minutes
  MIN_AUDIO_DURATION_MS: 500,    // 0.5 second
  MAX_AUDIO_FILE_SIZE_MB: 50,

  // Text
  MAX_MESSAGE_LENGTH: 5000,
  MAX_USER_NAME_LENGTH: 255,
  MIN_USER_NAME_LENGTH: 2,

  // Phone
  PHONE_LENGTH: 12, // +84XXXXXXXXX

  // Pagination
  DEFAULT_PAGE_LIMIT: 20,
  MAX_PAGE_LIMIT: 100,
  MIN_PAGE_LIMIT: 1,

  // Rate Limiting
  AUTH_RATE_LIMIT_PER_MINUTE: 5,
  VOICE_RATE_LIMIT_PER_MINUTE: 30,
  GENERAL_RATE_LIMIT_PER_MINUTE: 100,

  // Conversation
  MAX_CONCURRENT_CONVERSATIONS: 1,
  CONVERSATION_CONTEXT_SIZE: 10, // last 10 messages
  MAX_CACHED_CONVERSATIONS: 10,

  // Timeouts (milliseconds)
  STT_TIMEOUT_MS: 30000,  // 30 seconds
  TTS_TIMEOUT_MS: 10000,  // 10 seconds
  API_TIMEOUT_MS: 30000,  // 30 seconds

  // Cache TTL (seconds)
  NUMEROLOGY_CACHE_TTL: 3600,      // 1 hour
  CONVERSATION_CACHE_TTL: 600,     // 10 minutes
  USER_SESSION_TTL: 86400,          // 24 hours
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MINUTES: 15,
  REFRESH_TOKEN_DAYS: 7,
  OTP_VALIDITY_MINUTES: 5,
} as const;
