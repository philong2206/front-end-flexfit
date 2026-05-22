import { ApiUnauthorizedError } from "@/api/errors";
import { apiFetch } from "@/lib/apiFetch";

export const API_URL = "/api/profiles";

export interface MemberProfileResponse {
  memberProfileId?: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD format
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  preferredWorkoutTime?: string;
  bio?: string;
}

export interface UpdateMemberProfileRequest {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD format
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  preferredWorkoutTime?: string;
  bio?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getMyProfileApi = async (): Promise<MemberProfileResponse> => {
  const response = await apiFetch(`${API_URL}/me`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (response.status === 401) {
    throw new ApiUnauthorizedError();
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy thông tin hồ sơ thất bại");
  }
  return response.json();
};

export const updateMyProfileApi = async (data: UpdateMemberProfileRequest): Promise<{ message: string; data: MemberProfileResponse }> => {
  const response = await apiFetch(`${API_URL}/me`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (response.status === 401) {
    throw new ApiUnauthorizedError();
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Cập nhật hồ sơ thất bại");
  }
  return response.json();
};
