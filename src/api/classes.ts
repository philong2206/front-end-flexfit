import { apiFetch } from "@/lib/apiFetch";
import { withShortLivedCache } from "@/lib/simpleGetCache";

export const API_URL = "/api/classes";

export interface ClassDto {
  classId: string;
  branchId: string;
  branchName: string;
  categoryId: string;
  categoryName: string;
  className: string;
  description?: string;
  coachName?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  creditCost: number;
  difficultyLevel?: string;
  caloriesBurnEstimate?: number;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClassRequest {
  branchId: string;
  categoryId: string;
  className: string;
  description?: string;
  coachName?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  creditCost: number;
  difficultyLevel?: string;
  caloriesBurnEstimate?: number;
  thumbnailUrl?: string;
}

export interface UpdateClassRequest {
  categoryId: string;
  className: string;
  description?: string;
  coachName?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  creditCost: number;
  difficultyLevel?: string;
  caloriesBurnEstimate?: number;
  thumbnailUrl?: string;
  status: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllClassesApi = async (): Promise<ClassDto[]> => {
  return withShortLivedCache("GET:/api/classes", 45_000, async () => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lấy danh sách lớp học thất bại");
    }
    return response.json();
  });
};

export const getClassesByBranchApi = async (branchId: string): Promise<ClassDto[]> => {
  const response = await apiFetch(`${API_URL}/branch/${branchId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy danh sách lớp học theo chi nhánh thất bại");
  }
  return response.json();
};

export const getClassByIdApi = async (id: string): Promise<ClassDto> => {
  const response = await apiFetch(`${API_URL}/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Lấy chi tiết lớp học thất bại");
  }
  return response.json();
};

export const createClassApi = async (data: CreateClassRequest): Promise<{ message: string; classId: string }> => {
  const response = await apiFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Tạo lớp học thất bại");
  }
  return response.json();
};

export const updateClassApi = async (id: string, data: UpdateClassRequest): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Cập nhật lớp học thất bại");
  }
  return response.json();
};

export const changeClassStatusApi = async (id: string, status: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(status),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Cập nhật trạng thái lớp học thất bại");
  }
  return response.json();
};

export const deleteClassApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Xóa lớp học thất bại");
  }
  return response.json();
};
