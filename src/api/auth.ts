export const API_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/Auth`;
/**
 * Map backend error messages to friendly Vietnamese messages for login
 */
function mapLoginError(errorText: string, status: number): string {
  const lower = errorText.toLowerCase();
  
  // Check for authentication failures
  if (
    status === 401 ||
    status === 400 ||
    lower.includes("invalid") ||
    lower.includes("incorrect") ||
    lower.includes("wrong") ||
    lower.includes("password") ||
    lower.includes("email") ||
    lower.includes("credentials") ||
    lower.includes("authentication") ||
    lower.includes("unauthorized")
  ) {
    return "Email hoặc mật khẩu không đúng";
  }
  
  // Server errors
  if (status === 500) {
    // Check if it's still a login-related error
    if (
      lower.includes("password") ||
      lower.includes("login") ||
      lower.includes("invalid") ||
      lower.includes("credentials")
    ) {
      return "Email hoặc mật khẩu không đúng";
    }
    return "Hệ thống đang lỗi, vui lòng thử lại sau";
  }
  
  // Return original message if it's meaningful, otherwise generic error
  return errorText || "Đăng nhập thất bại";
}

/**
 * Map backend error messages to friendly Vietnamese messages for registration
 */
function mapRegisterError(errorText: string, status: number): string {
  const lower = errorText.toLowerCase();
  
  // Check for phone number validation
  if (
    lower.includes("phone") ||
    lower.includes("số điện thoại") ||
    lower.includes("phonenumber")
  ) {
    return "Vui lòng nhập số điện thoại";
  }
  
  // Check for existing account
  if (
    lower.includes("already") ||
    lower.includes("exist") ||
    lower.includes("đã tồn tại") ||
    lower.includes("registered") ||
    lower.includes("duplicate") ||
    (lower.includes("email") && lower.includes("taken"))
  ) {
    return "Tài khoản đã được đăng ký";
  }
  
  // Status-based fallbacks
  if (status === 409) {
    return "Tài khoản đã được đăng ký";
  }
  
  if (status === 500) {
    return "Hệ thống đang lỗi, vui lòng thử lại sau";
  }
  
  // Return original message if meaningful, otherwise generic error
  return errorText || "Đăng ký thất bại";
}

export const loginApi = async (data: Record<string, unknown>) => {
  console.log("LOGIN PAYLOAD:", data);
  
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const rawText = await response.text();
    console.error("Login error - Status:", response.status);
    console.error("Login error - Raw response:", rawText);
    
    const errorMessage = mapLoginError(rawText, response.status);
    throw new Error(errorMessage);
  }
  
  return response.json();
};

export const registerApi = async (data: Record<string, unknown>) => {
  console.log("REGISTER PAYLOAD:", data);
  
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const rawText = await response.text();
    console.error("Register error - Status:", response.status);
    console.error("Register error - Raw response:", rawText);
    
    const errorMessage = mapRegisterError(rawText, response.status);
    throw new Error(errorMessage);
  }
  
  return response.json();
};

export const verifyEmailApi = async (data: { email: string; otpCode: string }) => {
  const response = await fetch(`${API_URL}/verify-email`, {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Xác thực email thất bại");
  }
  return response.json();
};

export const googleLoginApi = async (token: string) => {
  const response = await fetch(`${API_URL}/google-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken: token }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Đăng nhập Google thất bại");
  }
  return response.json();
};

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export const forgotPasswordApi = async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Yêu cầu cấp lại mật khẩu thất bại");
  }
  return response.json();
};

export const resetPasswordApi = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Đổi mật khẩu thất bại");
  }
  return response.json();
};
