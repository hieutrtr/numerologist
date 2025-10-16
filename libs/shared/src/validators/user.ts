/**
 * User validation utilities
 */

import { LIMITS } from '../constants/limits';

export function validateUserName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Tên không được để trống' };
  }

  if (name.length < LIMITS.MIN_USER_NAME_LENGTH) {
    return { valid: false, error: `Tên phải có ít nhất ${LIMITS.MIN_USER_NAME_LENGTH} ký tự` };
  }

  if (name.length > LIMITS.MAX_USER_NAME_LENGTH) {
    return { valid: false, error: `Tên không được vượt quá ${LIMITS.MAX_USER_NAME_LENGTH} ký tự` };
  }

  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Email không hợp lệ' };
  }

  return { valid: true };
}

export function validateBirthDate(date: Date | string): { valid: boolean; error?: string } {
  const birthDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'Ngày sinh không hợp lệ' };
  }

  if (birthDate > new Date()) {
    return { valid: false, error: 'Ngày sinh không thể trong tương lai' };
  }

  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 13) {
    return { valid: false, error: 'Bạn phải ít nhất 13 tuổi' };
  }

  return { valid: true };
}
