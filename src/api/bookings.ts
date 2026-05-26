/* eslint-disable @typescript-eslint/no-explicit-any */
export const API_URL = "/api/bookings";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Parse error response and throw with proper error data
 */
async function handleApiError(response: Response, fallbackMessage: string) {
  try {
    const errorData = await response.json();
    // Throw the entire error object so normalizeApiError can process it
    const error: any = new Error(errorData.message || errorData.Message || fallbackMessage);
    error.response = { status: response.status, data: errorData };
    error.status = response.status;
    error.data = errorData;
    throw error;
  } catch (e) {
    if (e instanceof Error && e.message !== fallbackMessage) {
      throw e;
    }
    // If JSON parsing fails, throw with status code
    const error: any = new Error(fallbackMessage);
    error.status = response.status;
    throw error;
  }
}

export interface CreateGymBookingRequest {
  branchId: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

export interface CreateClassBookingRequest {
  classId: string;
}

export interface BookingResponse {
  bookingId: string;
  sessionId?: string;
  classId?: string;
  bookingCode: string;
  checkInStatus?: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedAt: string;
  userFullName?: string;
  userEmail?: string;
  branchName?: string;
  gymName?: string;
  sessionName?: string;
  className?: string;
  coachName?: string;
  creditUsed?: number;
  address?: string;
  district?: string;
  city?: string;
}

export const bookGymSessionApi = async (data: CreateGymBookingRequest) => {
  const response = await fetch(`${API_URL}/gym`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    await handleApiError(response, "Đặt lịch Gym thất bại");
  }
  return response.json();
};

export const getMyGymBookingsApi = async () => {
  const response = await fetch(`${API_URL}/gym/my-bookings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Lấy lịch Gym thất bại");
  }
  return response.json();
};

export const cancelGymBookingApi = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/gym/${bookingId}/cancel`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Hủy lịch Gym thất bại");
  }
  return response.json();
};

export const bookClassApi = async (data: CreateClassBookingRequest) => {
  const response = await fetch(`${API_URL}/class`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    await handleApiError(response, "Đặt lịch lớp học thất bại");
  }
  return response.json();
};

export const getMyClassBookingsApi = async () => {
  const response = await fetch(`${API_URL}/class/my-bookings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Lấy lịch lớp học thất bại");
  }
  return response.json();
};

export const cancelClassBookingApi = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/class/${bookingId}/cancel`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Hủy lịch lớp học thất bại");
  }
  return response.json();
};

export const getPartnerGymBookingsApi = async () => {
  const response = await fetch(`${API_URL}/partner/gym`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Lấy danh sách đặt lịch Gym thất bại");
  }
  return response.json();
};

export const getPartnerClassBookingsApi = async () => {
  const response = await fetch(`${API_URL}/partner/class`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    await handleApiError(response, "Lấy danh sách đặt lịch lớp học thất bại");
  }
  return response.json();
};
