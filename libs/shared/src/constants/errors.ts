/**
 * Application error codes
 */

export const ERROR_CODES = {
  // Authentication
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Voice Processing
  VOICE_TRANSCRIPTION_FAILED: 'VOICE_TRANSCRIPTION_FAILED',
  VOICE_SYNTHESIS_FAILED: 'VOICE_SYNTHESIS_FAILED',

  // AI Services
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTHENTICATION_FAILED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Thông tin đăng nhập không chính xác.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token hết hạn. Vui lòng đăng nhập lại.',
  [ERROR_CODES.UNAUTHORIZED]: 'Bạn không có quyền truy cập tài nguyên này.',

  [ERROR_CODES.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ.',
  [ERROR_CODES.INVALID_INPUT]: 'Đầu vào không được chấp nhận.',

  [ERROR_CODES.VOICE_TRANSCRIPTION_FAILED]: 'Không thể chuyển đổi giọng nói. Vui lòng thử lại.',
  [ERROR_CODES.VOICE_SYNTHESIS_FAILED]: 'Không thể tạo giọng nói. Vui lòng thử lại.',

  [ERROR_CODES.AI_SERVICE_ERROR]: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Quá nhiều yêu cầu. Vui lòng chờ trước khi thử lại.',

  [ERROR_CODES.DATABASE_ERROR]: 'Lỗi hệ thống. Vui lòng thử lại sau.',
  [ERROR_CODES.NOT_FOUND]: 'Không tìm thấy tài nguyên yêu cầu.',
  [ERROR_CODES.CONFLICT]: 'Tài nguyên đã tồn tại.',

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Lỗi hệ thống. Vui lòng thử lại sau.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
} as const;
