import { apiFetch } from "@/lib/apiFetch";

export const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/WorkoutHistory`;

export interface WorkoutHistoryDto {
  historyId: string;
  userId: string;
  checkInId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  caloriesBurned: number;
  workoutType: string;
}

export interface WorkoutStatisticsDto {
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
}

export interface UpdateWorkoutHistoryRequest {
  durationMinutes: number;
  caloriesBurned: number;
}

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getMyWorkoutHistoryApi = async (startDate?: string, endDate?: string): Promise<WorkoutHistoryDto[]> => {
  let query = "";
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    query = `?${params.toString()}`;
  }

  const response = await apiFetch(`${API_URL}/my-history${query}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy lịch sử tập luyện thất bại");
  }
  return response.json();
};

export const getWorkoutStatisticsApi = async (): Promise<WorkoutStatisticsDto> => {
  const response = await apiFetch(`${API_URL}/statistics`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Lấy thống kê tập luyện thất bại");
  }
  return response.json();
};

export const updateWorkoutHistoryApi = async (id: string, data: UpdateWorkoutHistoryRequest): Promise<{ message: string; data: unknown }> => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.Message || "Cập nhật lịch sử tập luyện thất bại");
  }
  return response.json();
};
