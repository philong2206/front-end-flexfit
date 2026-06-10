import { apiFetch } from "@/lib/apiFetch";

export const API_URL = "/api/Review";

export interface ReviewDto {
  reviewId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  memberName?: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  bookingType: string; // "Class" or "Gym"
  rating: number;
  comment: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const createReviewApi = async (data: CreateReviewRequest): Promise<{ message: string; data: unknown }> => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Gửi đánh giá thất bại");
  }
  return response.json();
};

export const getGymReviewsApi = async (gymId: string): Promise<ReviewDto[]> => {
  const response = await apiFetch(`${API_URL}/gym/${gymId}`);
  if (!response.ok) {
    if (response.status === 500 || response.status === 404) {
      return [];
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy danh sách đánh giá thất bại");
  }
  return response.json();
};
