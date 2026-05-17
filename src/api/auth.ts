export const API_URL = "/api/Auth";

export const loginApi = async (data: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Đăng nhập thất bại");
  }
  return response.json();
};

export const registerApi = async (data: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Đăng ký thất bại");
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
