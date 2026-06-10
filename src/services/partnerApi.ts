// Partner API Service
// Endpoints for GymPartner role

import { apiFetch } from "@/lib/apiFetch";

const API_BASE = "/api";

type PartnerChartPoint = {
  month?: string;
  value?: number;
};

type PartnerReviewApi = Record<string, unknown> & {
  reviewId?: string;
  rating?: number;
  comment?: string;
  customerName?: string;
  userFullName?: string;
  memberName?: string;
  gymName?: string;
  className?: string;
  createdAt?: string;
};

function unwrapCollection(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const wrapper = data as Record<string, unknown>;
    for (const key of ["data", "items", "result", "results", "records"]) {
      const nested = wrapper[key];
      if (Array.isArray(nested)) return nested as Record<string, unknown>[];
      if (nested && typeof nested === "object") {
        const unwrapped = unwrapCollection(nested);
        if (unwrapped.length > 0) return unwrapped;
      }
    }
  }
  return [];
}

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

  const data = await response.json();
  const occupancyRate = Number(data.occupancyRate ?? 0);
  const revenueChart = Array.isArray(data.revenueChart) ? data.revenueChart as PartnerChartPoint[] : [];
  const bookingChart = Array.isArray(data.bookingChart) ? data.bookingChart as PartnerChartPoint[] : [];

  return {
    revenue: data.revenueThisMonth,
    newCustomers: data.newCustomersThisMonth,
    totalBookings: data.bookingsThisMonth,
    occupancyRate: occupancyRate <= 1 ? occupancyRate * 100 : occupancyRate,
    revenueData: revenueChart.map((c) => ({ name: c.month ?? "", total: c.value ?? 0 })),
    attendanceData: bookingChart.map((c) => ({ time: c.month ?? "", count: c.value ?? 0 }))
  };
}

// ========== GYMS ==========
export async function getPartnerGyms() {
  const response = await apiFetch(`${API_BASE}/gyms/partner`);

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
  const response = await apiFetch(`${API_BASE}/branches/partner`);

  if (!response.ok) {
    await parseError(response, "Không thể tải danh sách chi nhánh");
  }

  return response.json();
}

// ========== CLASSES ==========
export async function getPartnerClasses() {
  const response = await apiFetch(`${API_BASE}/classes/partner`);

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
  const gyms = unwrapCollection(await getPartnerGyms().catch(() => []));
  const reviewGroups = await Promise.all(
    gyms
      .map((gym) => ({
        gymId: typeof gym.gymId === "string" ? gym.gymId : "",
        gymName: typeof gym.gymName === "string" ? gym.gymName : "",
      }))
      .filter((gym) => Boolean(gym.gymId))
      .map(async (gym) => {
        const response = await apiFetch(`${API_BASE}/Review/gym/${gym.gymId}`);
        if (!response.ok) return [];
        const data = await response.json().catch(() => []);
        return unwrapCollection(data).map((review) => ({
          ...review,
          gymName: typeof review.gymName === "string" && review.gymName ? review.gymName : gym.gymName,
        }));
      })
  );

  const reviews = reviewGroups.flat() as PartnerReviewApi[];

  return reviews.map((review, index) => ({
    reviewId: review.reviewId ?? `review-${index}`,
    rating: Number(review.rating ?? 0),
    comment: review.comment ?? "",
    customerName: review.customerName ?? review.userFullName ?? review.memberName ?? "Khách hàng",
    gymName: review.gymName ?? "",
    className: review.className ?? "",
    createdAt: review.createdAt ?? "",
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
