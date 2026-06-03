import { apiFetch } from "@/lib/apiFetch";

export const CLASSES_API_URL = "/api/favorite-classes";
export const GYMS_API_URL = "/api/favorite-gyms";

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const toggleFavoriteClassApi = async (classId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${CLASSES_API_URL}/toggle/${classId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Thao tác yêu thích lớp học thất bại");
  }
  return response.json();
};

export const getMyFavoriteClassesApi = async (): Promise<unknown[]> => {
  const response = await apiFetch(`${CLASSES_API_URL}/my-list`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy danh sách lớp học yêu thích thất bại");
  }
  return response.json();
};

export const toggleFavoriteGymApi = async (gymId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${GYMS_API_URL}/toggle/${gymId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Thao tác yêu thích phòng gym thất bại");
  }
  return response.json();
};

export const getMyFavoriteGymsApi = async (): Promise<unknown[]> => {
  const response = await apiFetch(`${GYMS_API_URL}/my-list`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy danh sách phòng gym yêu thích thất bại");
  }
  return response.json();
};
