// Constants for Numeroly App

export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:8000/v1' : 'https://api.numeroly.app/v1',
  TIMEOUT: 30000,
  WS_URL: __DEV__ ? 'ws://localhost:8000/ws' : 'wss://api.numeroly.app/ws',
};

export const VOICE_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BITS_PER_SAMPLE: 16,
  MAX_RECORDING_DURATION: 60000, // 60 seconds
};

export const ANIMATION_DURATIONS = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 400,
  PULSE: 2000,
};

export const NUMEROLOGY_COLORS = {
  lifePath: ['#6B4CE6', '#4ECDC4'],
  destiny: ['#F7B731', '#FFA502'],
  soul: ['#4ECDC4', '#05C46B'],
  personality: ['#6B4CE6', '#FF6B9D'],
};

export const PHONE_REGEX = /^\+84[0-9]{9,10}$/;

export const VIETNAMESE_GREETINGS = {
  morning: 'Chào buổi sáng',
  afternoon: 'Chào buổi chiều',
  evening: 'Chào buổi tối',
};
