/** Thrown when the API returns 401 — token missing, invalid, or expired. */
export class ApiUnauthorizedError extends Error {
  constructor(message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.") {
    super(message);
    this.name = "ApiUnauthorizedError";
  }
}
export class ApiError extends Error {
  status?: number;
  constructor(message = "API error") {
    super(message);
    this.name = "ApiError";
  }
}
