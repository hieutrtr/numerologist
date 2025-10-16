/**
 * Date validation utilities
 */

export function validateDate(date: Date | string): { valid: boolean; error?: string } {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Ngày không hợp lệ' };
  }

  return { valid: true };
}

export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string
): { valid: boolean; error?: string } {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Ngày không hợp lệ' };
  }

  if (start > end) {
    return { valid: false, error: 'Ngày bắt đầu phải trước ngày kết thúc' };
  }

  return { valid: true };
}

export function validatePastDate(date: Date | string): { valid: boolean; error?: string } {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Ngày không hợp lệ' };
  }

  if (parsedDate > new Date()) {
    return { valid: false, error: 'Ngày không thể trong tương lai' };
  }

  return { valid: true };
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
