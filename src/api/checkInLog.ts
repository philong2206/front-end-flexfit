import { apiFetch } from "@/lib/apiFetch";

export const API_URL = "/api/check-in-logs";

export interface ApiError extends Error {
  status?: number;
}

export interface CheckInLogDto {
  checkInId: string;
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  checkInTime: string;
  type: string; // "Gym" or "Class"
  className?: string;
  status: string;
  
  // Optional fallback fields for frontend compatibility
  customerName?: string;
  userFullName?: string;
  bookingType?: string;
  gymName?: string;
  sessionName?: string;
  name?: string;
  checkInAt?: string;
  scannedAt?: string;
}

export interface CheckInGymRequest {
  userId: string;
  gymBookingId: string;
  status: string;
  message?: string;
}

export interface CheckInClassRequest {
  userId: string;
  classBookingId: string;
  status: string;
  message?: string;
}

export const getAllLogsForAdminApi = async (): Promise<CheckInLogDto[]> => {
  const response = await apiFetch(`${API_URL}/admin/all`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.Message || "Lấy danh sách điểm danh thất bại");
    (err as ApiError).status = response.status;
    throw err;
  }
  return response.json();
};

export const getMyCheckInHistoryApi = async (): Promise<CheckInLogDto[]> => {
  const response = await apiFetch(`${API_URL}/my-history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.Message || "Lấy lịch sử điểm danh thất bại");
    (err as ApiError).status = response.status;
    throw err;
  }
  return response.json();
};

export const getLogsForManagerApi = async (): Promise<CheckInLogDto[]> => {
  const response = await apiFetch(`${API_URL}/manager/all`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.Message || "Lấy danh sách điểm danh quản lý thất bại");
    (err as ApiError).status = response.status;
    throw err;
  }
  return response.json();
};

export const checkInGymApi = async (data: CheckInGymRequest): Promise<{ message: string; data: unknown }> => {
  const response = await apiFetch(`${API_URL}/gym`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.Message || "Điểm danh gym thất bại");
    (err as ApiError).status = response.status;
    throw err;
  }
  return response.json();
};

export const checkInClassApi = async (data: CheckInClassRequest): Promise<{ message: string; data: unknown }> => {
  const response = await apiFetch(`${API_URL}/class`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.Message || "Điểm danh lớp học thất bại");
    (err as ApiError).status = response.status;
    throw err;
  }
  return response.json();
};
