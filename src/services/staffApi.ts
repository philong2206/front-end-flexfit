const API_BASE = "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export interface StaffDashboardStats {
  todayCheckIns: number;
  membersInGym: number;
  classesTonight: number;
  supportRequests: number;
}

export interface CheckInFeedItem {
  code: string;
  name: string;
  type: string;
  time: string;
}

export interface BookingSearchResult {
  code: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  level: string;
  type: "Class" | "Gym";
  targetName: string;
  instructor?: string;
  time: string;
  checkedIn: boolean;
}

export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
  const response = await fetch(`${API_BASE}/staff/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải thống kê dashboard nhân viên");
  }
  return response.json();
}

export async function searchBookingByCode(code: string): Promise<BookingSearchResult> {
  const response = await fetch(`${API_BASE}/staff/bookings/search?code=${encodeURIComponent(code)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không tìm thấy thông tin đặt chỗ với mã này");
  }
  return response.json();
}

export async function confirmCheckIn(code: string): Promise<void> {
  const response = await fetch(`${API_BASE}/staff/checkin`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Check-in thất bại");
  }
}

export async function getRecentCheckIns(): Promise<CheckInFeedItem[]> {
  const response = await fetch(`${API_BASE}/staff/checkin/recent`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách check-in gần đây");
  }
  return response.json();
}

export interface TodayClass {
  classId: string;
  className: string;
  instructorName?: string;
  coachName?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  capacity?: number;
  enrolled?: number;
  bookedCount?: number;
  status?: string;
  gymName?: string;
  room?: string;
}

export async function getTodayClasses(): Promise<TodayClass[]> {
  const response = await fetch(`${API_BASE}/staff/classes/today`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách lớp học hôm nay");
  }
  return response.json();
}
