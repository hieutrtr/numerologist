/**
 * Application default values
 */

export const DEFAULTS = {
  // Voice Settings
  VOICE_SPEED: 1.0,
  VOICE_TONE: 'warm' as const,
  VOLUME: 0.8,

  // Dialect
  DIALECT: 'northern' as const,
  INTERACTION_STYLE: 'casual' as const,

  // API
  API_VERSION: 'v1',
  RESPONSE_TIMEOUT_MS: 30000,

  // Pagination
  PAGE_LIMIT: 20,
  PAGE_OFFSET: 0,

  // Conversation
  PRIMARY_TOPIC: 'General Guidance',
  EMOTIONAL_TAGS: [] as string[],

  // Numerology
  NUMEROLOGY_LANGUAGE: 'vi' as const,
} as const;

export const SUPPORTED_LOCALES = {
  VI: 'vi-VN',
  EN: 'en-US',
} as const;

export const VOICE_OPTIONS = {
  TONES: ['warm', 'neutral', 'energetic'] as const,
  SPEEDS: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const,
  VOLUMES: [0, 0.2, 0.4, 0.6, 0.8, 1.0] as const,
} as const;

export const DIALECTS = ['northern', 'southern', 'central'] as const;

export const EMOTIONAL_TAGS = [
  'seeking_guidance',
  'stressed',
  'curious',
  'anxious',
  'hopeful',
  'confused',
  'confident',
] as const;
