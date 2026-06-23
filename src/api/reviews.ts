import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/Review`;

export interface ReviewDto {
  reviewId: string;
  userId?: string;
  gymId?: string;
  gymName?: string;
  classId?: string | null;
  className?: string | null;
  gymBookingId?: string | null;
  classBookingId?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  memberName?: string; // normalized from userFullName
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

// Normalize a raw API object into ReviewDto
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeReview = (raw: any): ReviewDto => ({
  reviewId:       raw.reviewId       ?? raw.ReviewId       ?? "",
  userId:         raw.userId         ?? raw.UserId         ?? undefined,
  gymId:          raw.gymId          ?? raw.GymId          ?? undefined,
  gymName:        raw.gymName        ?? raw.GymName        ?? undefined,
  classId:        raw.classId        ?? raw.ClassId        ?? null,
  className:      raw.className      ?? raw.ClassName      ?? null,
  gymBookingId:   raw.gymBookingId   ?? raw.GymBookingId   ?? null,
  classBookingId: raw.classBookingId ?? raw.ClassBookingId ?? null,
  rating:         raw.rating         ?? raw.Rating         ?? 0,
  comment:        raw.comment        ?? raw.Comment        ?? "",
  createdAt:      raw.createdAt      ?? raw.CreatedAt      ?? "",
  // Backend trả về "userFullName"
  memberName:
    raw.userFullName  ??
    raw.UserFullName  ??
    raw.memberName    ??
    raw.MemberName    ??
    raw.fullName      ??
    raw.FullName      ??
    raw.userName      ??
    raw.UserName      ??
    undefined,
});

export const createReviewApi = async (
  data: CreateReviewRequest
): Promise<{ message: string; data: unknown }> => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.Message || "Gửi đánh giá thất bại"
    );
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
    throw new Error(
      errorData.message || errorData.Message || "Lấy danh sách đánh giá thất bại"
    );
  }
  const raw = await response.json();
  // Support both a plain array and a wrapped { data: [...] } response
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : (raw?.data ?? raw?.Data ?? []);
  return list.map(normalizeReview);
};
