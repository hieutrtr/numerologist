/**
 * Type conversion utilities
 */

export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false' && value !== '0' && value !== '';
  }
  return Boolean(value);
}

export function toNumber(value: unknown, defaultValue = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function toString(value: unknown, defaultValue = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function toJSON<T>(value: unknown, defaultValue: T): T {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value as T;
  } catch {
    return defaultValue;
  }
}

export function fromJSON<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function toMilliseconds(value: number, unit: 'ms' | 's' | 'm' | 'h'): number {
  const multipliers = { ms: 1, s: 1000, m: 60000, h: 3600000 };
  return value * (multipliers[unit] || 1);
}

export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}
