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
export async function getPartnerDashboardStats() {
  const response = await fetch(`${API_BASE}/partner/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải thống kê dashboard");
  }
  return response.json();
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
export async function getPartnerCustomers() {
  const response = await fetch(`${API_BASE}/partner/customers`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách khách hàng");
  }
  return response.json();
}

// ========== REVENUE ==========
export async function getPartnerRevenueReport(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  const response = await fetch(`${API_BASE}/partner/revenue${query ? `?${query}` : ""}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải báo cáo doanh thu");
  }
  return response.json();
}

// ========== PROMOTIONS ==========
export async function getPartnerPromotions() {
  const response = await fetch(`${API_BASE}/promotions?includeInactive=true`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách khuyến mãi");
  }
  return response.json();
}

export async function createPromotion(data: unknown) {
  const response = await fetch(`${API_BASE}/promotions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tạo khuyến mãi");
  }
  return response.json();
}

export async function updatePromotion(promotionId: string, data: unknown) {
  const response = await fetch(`${API_BASE}/promotions/${promotionId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể cập nhật khuyến mãi");
  }
  return response.json();
}

export async function deletePromotion(promotionId: string) {
  const response = await fetch(`${API_BASE}/promotions/${promotionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể xóa khuyến mãi");
  }
  return response.json();
}

// ========== REVIEWS ==========
export async function getPartnerReviews() {
  const response = await fetch(`${API_BASE}/partner/reviews`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể tải danh sách đánh giá");
  }
  return response.json();
}
