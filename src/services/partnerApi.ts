// Partner API Service
// Endpoints for GymPartner role

import { apiFetch } from "@/lib/apiFetch";

const API_BASE = "/api";

async function parseError(response: Response, fallbackMessage: string): Promise<never> {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || error.Message || fallbackMessage);
}

// ========== DASHBOARD ==========
export async function getPartnerDashboardStats() {
  const response = await apiFetch(`${API_BASE}/partner/dashboard`);

  if (!response.ok) {
    await parseError(response, "Không thể tải thống kê dashboard");
  }

  return response.json();
}

// ========== GYMS ==========
export async function getPartnerGyms() {
  const response = await apiFetch(`${API_BASE}/gyms`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách phòng tập");
  }

  return response.json();
}

export async function getGymById(gymId: string) {
  const response = await apiFetch(`${API_BASE}/gyms/${gymId}`);

  if (!response.ok) {
    await parseError(response, "Không thể tải thông tin phòng tập");
  }

  return response.json();
}

export async function createGym(data: unknown) {
  const response = await apiFetch(`${API_BASE}/gyms`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await parseError(response, "Không thể tạo phòng tập");
  }

  return response.json();
}

export async function updateGym(gymId: string, data: unknown) {
  const response = await apiFetch(`${API_BASE}/gyms/${gymId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await parseError(response, "Không thể cập nhật phòng tập");
  }

  return response.json();
}

export async function deleteGym(gymId: string) {
  const response = await apiFetch(`${API_BASE}/gyms/${gymId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await parseError(response, "Không thể xóa phòng tập");
  }

  return response.json().catch(() => ({}));
}

// ========== BRANCHES ==========
export async function getPartnerBranches() {
  const response = await apiFetch(`${API_BASE}/branches`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách chi nhánh");
  }

  return response.json();
}

// ========== CLASSES ==========
export async function getPartnerClasses() {
  const response = await apiFetch(`${API_BASE}/classes`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách lớp học");
  }

  return response.json();
}

export async function getClassesByBranch(branchId: string) {
  const response = await apiFetch(`${API_BASE}/classes/branch/${branchId}`);

  if (!response.ok) {
    await parseError(response, "Không thể tải lớp học của chi nhánh");
  }

  return response.json();
}

// ========== BOOKINGS ==========
export async function getPartnerGymBookings() {
  const response = await apiFetch(`${API_BASE}/bookings/partner/gym`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách booking gym");
  }

  return response.json();
}

export async function getPartnerClassBookings() {
  const response = await apiFetch(`${API_BASE}/bookings/partner/class`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách booking lớp học");
  }

  return response.json();
}

// ========== CUSTOMERS ==========
export async function getPartnerCustomers() {
  const response = await apiFetch(`${API_BASE}/partner/customers`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách khách hàng");
  }

  return response.json();
}

// ========== REVENUE ==========
export async function getPartnerRevenueReport(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const query = params.toString();

  const response = await apiFetch(
    `${API_BASE}/partner/revenue${query ? `?${query}` : ""}`
  );

  if (!response.ok) {
    await parseError(response, "Không thể tải báo cáo doanh thu");
  }

  return response.json();
}

// ========== PROMOTIONS ==========
export async function getPartnerPromotions() {
  const response = await apiFetch(`${API_BASE}/promotions?includeInactive=true`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách khuyến mãi");
  }

  return response.json();
}

export async function createPromotion(data: unknown) {
  const response = await apiFetch(`${API_BASE}/promotions`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await parseError(response, "Không thể tạo khuyến mãi");
  }

  return response.json();
}

export async function updatePromotion(promotionId: string, data: unknown) {
  const response = await apiFetch(`${API_BASE}/promotions/${promotionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await parseError(response, "Không thể cập nhật khuyến mãi");
  }

  return response.json();
}

export async function deletePromotion(promotionId: string) {
  const response = await apiFetch(`${API_BASE}/promotions/${promotionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await parseError(response, "Không thể xóa khuyến mãi");
  }

  return response.json().catch(() => ({}));
}

// ========== REVIEWS ==========
export async function getPartnerReviews() {
  const response = await apiFetch(`${API_BASE}/partner/reviews`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách đánh giá");
  }

  return response.json();
}