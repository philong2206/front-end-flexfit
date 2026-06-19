import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/promotions`;

export interface PromotionDto {
  promotionId: string;
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status?: string;
}

export interface CreatePromotionRequest {
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllPromotionsApi = async (isActiveOnly?: boolean): Promise<PromotionDto[]> => {
  const query = isActiveOnly !== undefined ? `?isActiveOnly=${isActiveOnly}` : "";
  const response = await apiFetch(`${API_URL}${query}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy danh sách khuyến mãi thất bại");
  }
  return response.json();
};

export const getPromotionByIdApi = async (id: string): Promise<PromotionDto> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy chi tiết khuyến mãi thất bại");
  }
  return response.json();
};

export const createPromotionApi = async (data: CreatePromotionRequest): Promise<PromotionDto> => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Tạo khuyến mãi thất bại");
  }
  return response.json();
};

export const deletePromotionApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Xóa khuyến mãi thất bại");
  }
  return response.json();
};
