export const API_URL = "/api/bookings";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

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
  userId: string;
  gymId?: string;
  classId?: string;
  bookingCode: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  userFullName?: string;
  userEmail?: string;
  branchName?: string;
  sessionName?: string;
  className?: string;
  creditUsed?: number;
}

export const bookGymSessionApi = async (data: CreateGymBookingRequest) => {
  const response = await fetch(`${API_URL}/gym`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Đặt lịch Gym thất bại");
  }
  return response.json();
};

export const getMyGymBookingsApi = async () => {
  const response = await fetch(`${API_URL}/gym/my-bookings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Lấy lịch Gym thất bại");
  }
  return response.json();
};

export const cancelGymBookingApi = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/gym/${bookingId}/cancel`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Hủy lịch Gym thất bại");
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Đặt lịch lớp học thất bại");
  }
  return response.json();
};

export const getMyClassBookingsApi = async () => {
  const response = await fetch(`${API_URL}/class/my-bookings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Lấy lịch lớp học thất bại");
  }
  return response.json();
};

export const cancelClassBookingApi = async (bookingId: string) => {
  const response = await fetch(`${API_URL}/class/${bookingId}/cancel`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Hủy lịch lớp học thất bại");
  }
  return response.json();
};

export const getPartnerGymBookingsApi = async () => {
  const response = await fetch(`${API_URL}/partner/gym`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Lấy danh sách đặt lịch Gym thất bại");
  }
  return response.json();
};

export const getPartnerClassBookingsApi = async () => {
  const response = await fetch(`${API_URL}/partner/class`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Message || "Lấy danh sách đặt lịch lớp học thất bại");
  }
  return response.json();
};
