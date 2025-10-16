/**
 * Phone number validation utilities
 */

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // Vietnamese phone number format: +84XXXXXXXXX or 0XXXXXXXXX
  const vietnamPhoneRegex = /^(\+84|0)[1-9]\d{8,9}$/;

  if (!phone || !vietnamPhoneRegex.test(phone)) {
    return { valid: false, error: 'Số điện thoại không hợp lệ' };
  }

  return { valid: true };
}

export function normalizePhoneNumber(phone: string): string {
  // Remove spaces and dashes
  let normalized = phone.replace(/[\s\-()]/g, '');

  // Convert 0 prefix to +84
  if (normalized.startsWith('0')) {
    normalized = '+84' + normalized.substring(1);
  }

  return normalized;
}

export function formatPhoneNumber(phone: string): string {
  // Format: +84 9XX XXX XXX
  const normalized = normalizePhoneNumber(phone);

  if (!normalized.startsWith('+84')) {
    return normalized;
  }

  const digits = normalized.substring(3);
  return `+84 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
}
