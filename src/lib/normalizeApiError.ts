/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Normalize API errors to user-friendly Vietnamese messages
 * Maps error codes and status codes to specific messages
 */

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  Message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export function normalizeApiError(error: any): string {
  // If it's already a string, return it
  if (typeof error === "string") return error;

  // Extract error data from various response formats
  const errorData: ApiErrorResponse = 
    error?.response?.data || 
    error?.data || 
    error || 
    {};

  const statusCode = error?.response?.status || error?.status || errorData.status;
  const errorCode = errorData.code;
  const message = errorData.message || errorData.Message || errorData.error;

  // Handle specific error codes from backend
  if (errorCode) {
    switch (errorCode.toUpperCase()) {
      case "INSUFFICIENT_CREDITS":
        return "Bạn không đủ credit để đặt lịch";
      case "SLOT_FULL":
        return "Khung giờ này đã đầy";
      case "ALREADY_BOOKED":
        return "Bạn đã đặt lịch khung giờ này";
      case "GYM_CLOSED":
        return "Gym hiện không hoạt động";
      case "SLOT_NOT_FOUND":
        return "Khung giờ không tồn tại";
      case "CLASS_INACTIVE":
        return "Lớp học hiện không hoạt động";
      case "INVALID_CREDENTIALS":
        return "Email hoặc mật khẩu không đúng";
      case "EMAIL_ALREADY_EXISTS":
        return "Email đã được đăng ký";
      case "ACCOUNT_LOCKED":
        return "Tài khoản của bạn đã bị khóa";
      case "PAYMENT_FAILED":
        return "Thanh toán thất bại";
      case "PAYMENT_CANCELLED":
        return "Bạn đã hủy thanh toán";
      case "INVALID_TOKEN":
        return "Phiên đăng nhập không hợp lệ";
      case "TOKEN_EXPIRED":
        return "Phiên đăng nhập đã hết hạn";
      case "UNAUTHORIZED":
        return "Bạn không có quyền thực hiện thao tác này";
      case "NOT_FOUND":
        return "Không tìm thấy dữ liệu";
      default:
        // If we have a code but no mapping, use the message
        if (message) return message;
    }
  }

  // Handle HTTP status codes
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return message || "Dữ liệu không hợp lệ";
      case 401:
        return "Phiên đăng nhập đã hết hạn";
      case 403:
        return "Bạn không có quyền thực hiện thao tác này";
      case 404:
        return "Không tìm thấy dữ liệu";
      case 409:
        return message || "Dữ liệu đã tồn tại";
      case 422:
        return message || "Dữ liệu không hợp lệ";
      case 429:
        return "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau";
      case 500:
        return "Máy chủ gặp lỗi. Vui lòng thử lại sau";
      case 502:
      case 503:
        return "Không thể kết nối máy chủ. Vui lòng thử lại sau";
      case 504:
        return "Máy chủ không phản hồi. Vui lòng thử lại sau";
    }
  }

  // Check for validation errors
  if (errorData.errors && typeof errorData.errors === "object") {
    const firstError = Object.values(errorData.errors).flat()[0];
    if (firstError) return firstError;
  }

  // Return message if available
  if (message) return message;

  // Fallback to generic error
  return "Đã xảy ra lỗi. Vui lòng thử lại";
}

/**
 * Get toast type based on error code or status
 */
export function getErrorToastType(error: any): "error" | "warning" | "info" {
  const errorData: ApiErrorResponse = 
    error?.response?.data || 
    error?.data || 
    error || 
    {};

  const errorCode = errorData.code;

  // Warning for user-fixable issues
  if (errorCode) {
    switch (errorCode.toUpperCase()) {
      case "INSUFFICIENT_CREDITS":
      case "SLOT_FULL":
      case "ALREADY_BOOKED":
        return "warning";
      case "PAYMENT_CANCELLED":
        return "info";
      default:
        return "error";
    }
  }

  return "error";
}

/**
 * Check if error is due to insufficient credits
 */
export function isInsufficientCreditsError(error: any): boolean {
  const errorData: ApiErrorResponse = 
    error?.response?.data || 
    error?.data || 
    error || 
    {};

  return errorData.code?.toUpperCase() === "INSUFFICIENT_CREDITS";
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: any): boolean {
  const statusCode = error?.response?.status || error?.status;
  const errorCode = error?.response?.data?.code || error?.data?.code || error?.code;

  return (
    statusCode === 401 ||
    errorCode?.toUpperCase() === "TOKEN_EXPIRED" ||
    errorCode?.toUpperCase() === "INVALID_TOKEN" ||
    errorCode?.toUpperCase() === "UNAUTHORIZED"
  );
}
