// Partner API Service
// Endpoints for GymPartner role

const API_BASE = "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ========== DASHBOARD ==========
// TODO: Backend chưa có endpoint dashboard tổng hợp
// Cần tạo endpoint: GET /api/partner/dashboard
export async function getPartnerDashboardStats() {
  throw new Error("API endpoint chưa được triển khai: GET /api/partner/dashboard");
  // Expected response:
  // {
  //   revenue: number,
  //   newCustomers: number,
  //   totalBookings: number,
  //   occupancyRate: number,
  //   revenueData: Array<{name: string, total: number}>,
  //   attendanceData: Array<{time: string, count: number}>
  // }
}

// ========== GYMS ==========
// Backend có: GET /api/gyms
export async function getPartnerGyms() {
  const response = await fetch(`${API_BASE}/gyms`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách phòng tập");
  }
  return response.json();
}

// Backend có: GET /api/gyms/{id}
export async function getGymById(gymId: string) {
  const response = await fetch(`${API_BASE}/gyms/${gymId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải thông tin phòng tập");
  }
  return response.json();
}

// Backend có: POST /api/gyms
export async function createGym(data: unknown) {
  const response = await fetch(`${API_BASE}/gyms`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tạo phòng tập");
  }
  return response.json();
}

// Backend có: PUT /api/gyms/{id}
export async function updateGym(gymId: string, data: unknown) {
  const response = await fetch(`${API_BASE}/gyms/${gymId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể cập nhật phòng tập");
  }
  return response.json();
}

// Backend có: DELETE /api/gyms/{id}
export async function deleteGym(gymId: string) {
  const response = await fetch(`${API_BASE}/gyms/${gymId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể xóa phòng tập");
  }
  return response.json();
}

// ========== BRANCHES ==========
// Backend có: GET /api/branches
export async function getPartnerBranches() {
  const response = await fetch(`${API_BASE}/branches`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách chi nhánh");
  }
  return response.json();
}

// ========== CLASSES ==========
// Backend có: GET /api/classes
export async function getPartnerClasses() {
  const response = await fetch(`${API_BASE}/classes`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách lớp học");
  }
  return response.json();
}

// Backend có: GET /api/classes/branch/{branchId}
export async function getClassesByBranch(branchId: string) {
  const response = await fetch(`${API_BASE}/classes/branch/${branchId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải lớp học của chi nhánh");
  }
  return response.json();
}

// ========== BOOKINGS ==========
// Backend có: GET /api/bookings/partner/gym
export async function getPartnerGymBookings() {
  const response = await fetch(`${API_BASE}/bookings/partner/gym`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách booking gym");
  }
  return response.json();
}

// Backend có: GET /api/bookings/partner/class
export async function getPartnerClassBookings() {
  const response = await fetch(`${API_BASE}/bookings/partner/class`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách booking lớp học");
  }
  return response.json();
}

// ========== CUSTOMERS ==========
// Backend có GET /api/users nhưng trả về tất cả users (không filter theo partner)
// Cần tạo endpoint riêng: GET /api/partner/customers hoặc GET /api/bookings/partner/customers
export async function getPartnerCustomers() {
  throw new Error("Backend chưa hỗ trợ API danh sách khách hàng");
  // Expected response: Array of customer objects with booking history filtered by partner's gyms
}

// ========== REVENUE ==========
// TODO: Backend chưa có endpoint báo cáo doanh thu
// Cần tạo endpoint: GET /api/partner/revenue?startDate=&endDate=
export async function getPartnerRevenueReport(_startDate?: string, _endDate?: string) {
  throw new Error("API endpoint chưa được triển khai: GET /api/partner/revenue");
  // Expected response:
  // {
  //   totalRevenue: number,
  //   revenueByMonth: Array<{month: string, amount: number}>,
  //   revenueByBranch: Array<{branchName: string, amount: number}>,
  //   revenueByClass: Array<{className: string, amount: number}>
  // }
}

// ========== PROMOTIONS ==========
// TODO: Backend chưa có endpoint quản lý khuyến mãi
// Cần tạo endpoint: GET /api/partner/promotions
export async function getPartnerPromotions() {
  throw new Error("API endpoint chưa được triển khai: GET /api/partner/promotions");
}

export async function createPromotion(_data: unknown) {
  throw new Error("API endpoint chưa được triển khai: POST /api/partner/promotions");
}

export async function updatePromotion(_promotionId: string, _data: unknown) {
  throw new Error("API endpoint chưa được triển khai: PUT /api/partner/promotions/{id}");
}

export async function deletePromotion(_promotionId: string) {
  throw new Error("API endpoint chưa được triển khai: DELETE /api/partner/promotions/{id}");
}

// ========== REVIEWS ==========
// TODO: Backend chưa có endpoint quản lý đánh giá
// Cần tạo endpoint: GET /api/partner/reviews
export async function getPartnerReviews() {
  throw new Error("API endpoint chưa được triển khai: GET /api/partner/reviews");
}
