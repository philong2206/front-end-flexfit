import { apiFetch } from "@/lib/apiFetch";
import { withShortLivedCache } from "@/lib/simpleGetCache";

export const API_URL = "/api/categories";

export interface CategoryDto {
  categoryId: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllCategoriesApi = async (): Promise<CategoryDto[]> => {
  return withShortLivedCache("GET:/api/categories", 45_000, async () => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lấy danh sách danh mục thất bại");
    }
    return response.json();
  });
};

export const getCategoryByIdApi = async (id: string): Promise<CategoryDto> => {
  const response = await apiFetch(`${API_URL}/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy chi tiết danh mục thất bại");
  }
  return response.json();
};

export const createCategoryApi = async (data: CreateCategoryRequest): Promise<{ message: string; categoryId: string }> => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Tạo danh mục thất bại");
  }
  return response.json();
};

export const updateCategoryApi = async (id: string, data: UpdateCategoryRequest): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Cập nhật danh mục thất bại");
  }
  return response.json();
};

export const deleteCategoryApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Xóa danh mục thất bại");
  }
  return response.json();
};
